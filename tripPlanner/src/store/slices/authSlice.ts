import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginCredentials, RegisterData } from '../../types/types';
import { BASE_URL_JWT } from '../../utils/ApiConstants.ts';
import { isTokenExpired, getUserFromToken, getTokenExpiry } from '../../utils/tokenUtils.ts';


const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tokenExpiry: null,
  lastActivity: Date.now(),
  sessionTimeout: 30 * 60 * 1000,
  isInitialized: false,
  loginEmail: null,
};


export const loginUser = createAsyncThunk(
  '/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      console.log('Login attempt with identifier:', credentials.identifier);
      const response = await fetch(`${BASE_URL_JWT}/sso/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
    if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || `HTTP ${response.status}`;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status} - ${response.statusText}`;
        }
        return rejectWithValue(errorMessage);
      }

      const rawText = await response.text();
      console.log('Raw login response:', rawText);

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        return rejectWithValue('Invalid JSON response from server');
      }
      
      console.log('Parsed login response:', data);
      
      let token, refreshToken;
      
      if (data.accessToken && data.refreshToken) {
        token = data.accessToken;
        refreshToken = data.refreshToken;
      } else if (data.token && data.refreshToken) {
        token = data.token;
        refreshToken = data.refreshToken;
      } else if (data.data && data.data.accessToken && data.data.refreshToken) {
        token = data.data.accessToken;
        refreshToken = data.data.refreshToken;
      } else if (data.data && data.data.token && data.data.refreshToken) {
        token = data.data.token;
        refreshToken = data.data.refreshToken;
      } else if (data.result && data.result.accessToken && data.result.refreshToken) {
        token = data.result.accessToken;
        refreshToken = data.result.refreshToken;
      } else if (data.result && data.result.token && data.result.refreshToken) {
        token = data.result.token;
        refreshToken = data.result.refreshToken;
      }
      
      if (!token || !refreshToken) {
        console.error('Token extraction failed. Response structure:', Object.keys(data));
        return rejectWithValue('Invalid response from server - no valid tokens found');
      }

      if (isTokenExpired(token)) {
        return rejectWithValue('Received expired token');
      }

      console.log('Login successful, tokens extracted');
      return {
        token,
        refreshToken,
        loginEmail: credentials.identifier.includes('@') ? credentials.identifier : null,
        message: data.message || 'Login successful'
      };
    } catch (error) {
      console.error('Login network error:', error);
      return rejectWithValue('Network error occurred');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL_JWT}/sso/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const refreshTokenAsync = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const { refreshToken } = state.auth;

      if (!refreshToken) {
        return rejectWithValue('No refresh token available');
      }

      const response = await fetch(`${BASE_URL_JWT}/sso/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          refreshToken: refreshToken,
          accessToken: state.auth.token
        }),
      });

      if (!response.ok) {
        return rejectWithValue('Token refresh failed');
      }

      const data = await response.json();
      const token = data.token;
      
      if (!token) {
        return rejectWithValue('Invalid refresh response');
      }

      return {
        token,
        refreshToken: data.refreshToken || refreshToken,
      };
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const { token } = state.auth;

      if (token) {
        await fetch(`${BASE_URL_JWT}/sso/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    }
    
    return null;
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateActivity: (state) => {
      state.lastActivity = Date.now();
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    checkSession: (state) => {
      const now = Date.now();
      const isSessionExpired = now - state.lastActivity > state.sessionTimeout;
      
      if (isSessionExpired || (state.token && isTokenExpired(state.token))) {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.tokenExpiry = null;
        state.loginEmail = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('email');
        localStorage.removeItem('loginEmail');
      }
    },
    
    initializeAuth: (state) => {
      if (state.isInitialized) {
        return;
      }
      
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const loginEmail = localStorage.getItem('loginEmail');
        
        if (token && refreshToken && !isTokenExpired(token)) {
          const user = getUserFromToken(token, loginEmail || undefined);
          if (user) {
            state.token = token;
            state.refreshToken = refreshToken;
            state.user = user;
            state.isAuthenticated = true;
            state.tokenExpiry = getTokenExpiry(token);
            state.lastActivity = Date.now();
            state.loginEmail = loginEmail;
          }
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('email');
          localStorage.removeItem('loginEmail');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('email');
        localStorage.removeItem('loginEmail');
      } finally {
        state.isInitialized = true;
      }
    },
    
    forceLogout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.tokenExpiry = null;
      state.error = null;
      state.loginEmail = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('email');
      localStorage.removeItem('loginEmail');
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // .addCase(loginUser.fulfilled, (state, action) => {
      //   const { token, refreshToken, loginEmail } = action.payload;
      //   const user = getUserFromToken(token, loginEmail || undefined);
        
      //   console.log('Login fulfilled, user extracted:', user);
        
      //   if (user) {
      //     state.user = user;
      //     state.token = token;
      //     state.refreshToken = refreshToken;
      //     state.isAuthenticated = true;
      //     state.tokenExpiry = getTokenExpiry(token);
      //     state.lastActivity = Date.now();
      //     state.isLoading = false;
      //     state.error = null;
      //     state.loginEmail = loginEmail;
          
      //     localStorage.setItem('authToken', token);
      //     localStorage.setItem('accessToken', token);
      //     localStorage.setItem('refreshToken', refreshToken);
      //     localStorage.setItem('email', user.email);
      //     if (loginEmail) {
      //       localStorage.setItem('loginEmail', loginEmail);
      //     }
          
      //     console.log('=== Final Auth State ===');
      //     console.log('User email:', user.email);
      //     console.log('Login email:', loginEmail);
      //     console.log('=====================');
      //   } else {
      //     console.error('Failed to extract user from token');
      //     state.isLoading = false;
      //     state.error = 'Failed to process user data';
      //   }
      // })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { token, refreshToken, loginEmail } = action.payload;
        const user = getUserFromToken(token, loginEmail || undefined);
        
        console.log('Login fulfilled, user extracted:', user);
        
        if (user) {
          state.user = user;
          state.token = token;
          state.refreshToken = refreshToken;
          state.isAuthenticated = true;
          state.tokenExpiry = getTokenExpiry(token);
          state.lastActivity = Date.now();
          state.isLoading = false;
          state.error = null;
          state.loginEmail = loginEmail;
          
          // Store in localStorage (existing)
          localStorage.setItem('authToken', token);
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('email', user.email);
          if (loginEmail) {
            localStorage.setItem('loginEmail', loginEmail);
          }
          
          // Store in localStorage for navbar
          const authData = {
            email: user.email,
            userName:user.email.split('@')[0], // fallback to email prefix if no name
            companyName: (user.companyName && user.companyName.trim()) || (user.company && user.company.trim()) || 'Fly Divine' // fallback to default if empty or whitespace
          };
          
          localStorage.setItem('authData', JSON.stringify(authData));
          localStorage.setItem('userEmail', user.email);
          localStorage.setItem('userName', authData.userName);
          localStorage.setItem('companyName', authData.companyName);
          
          console.log('=== Final Auth State ===');
          console.log('User email:', user.email);
          console.log('Login email:', loginEmail);
          console.log('Company name:', authData.companyName);
          console.log('=====================');
        } else {
          console.error('Failed to extract user from token');
          state.isLoading = false;
          state.error = 'Failed to process user data';
        }
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Refresh token
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        const { token, refreshToken } = action.payload;
        const user = getUserFromToken(token, state.loginEmail || undefined);
        
        if (user) {
          state.token = token;
          state.refreshToken = refreshToken || state.refreshToken;
          state.user = user;
          state.tokenExpiry = getTokenExpiry(token);
          state.lastActivity = Date.now();
          
          localStorage.setItem('authToken', token);
          localStorage.setItem('accessToken', token);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          localStorage.setItem('email', user.email);
        }
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.tokenExpiry = null;
        state.loginEmail = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('email');
        localStorage.removeItem('loginEmail');
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.tokenExpiry = null;
        state.isLoading = false;
        state.error = null;
        state.loginEmail = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('email');
        localStorage.removeItem('loginEmail');
      });
  },
});

export const { 
  updateActivity, 
  clearError, 
  checkSession, 
  initializeAuth, 
  forceLogout 
} = authSlice.actions;

export default authSlice.reducer;