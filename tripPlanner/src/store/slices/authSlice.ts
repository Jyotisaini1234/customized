import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginCredentials, RegisterData } from '../../types/types';
import { BASE_URL_JWT } from '../../utils/ApiConstants.ts';
import { isTokenExpired, getUserFromToken, getTokenExpiry } from '../../utils/tokenUtils.ts';
import { initDB, saveToDB, getFromDB } from '../../utils/TripPlannerDB.ts';

const AUTH_STORE = 'authData';

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

const clearAuth = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([AUTH_STORE], 'readwrite');
    const objectStore = transaction.objectStore(AUTH_STORE);
    const keysToRemove = ['authToken','accessToken', 'refreshToken','email','loginEmail','authData','userEmail','userName','companyName'];
    keysToRemove.forEach(key => {
      objectStore.delete(key);
    });
  } catch (error) {
    console.error('Error clearing auth data from IndexedDB:', error);
  }
};

const saveAuth = async (authData: {
  token: string;
  refreshToken: string;
  user: any;
  loginEmail: string | null;
}) => {
  try {
    const { token, refreshToken, user, loginEmail } = authData;
    
    await saveToDB(AUTH_STORE, 'authToken', token);
    await saveToDB(AUTH_STORE, 'accessToken', token);
    await saveToDB(AUTH_STORE, 'refreshToken', refreshToken);
    await saveToDB(AUTH_STORE, 'email', user.email);
    if (loginEmail) {
      await saveToDB(AUTH_STORE, 'loginEmail', loginEmail);
    }
    
    const structuredAuthData = {
      email: user.email,
      companyName: (user.companyName && user.companyName.trim()) || (user.company && user.company.trim())
    };
    
    await saveToDB(AUTH_STORE, 'authData', structuredAuthData);
    await saveToDB(AUTH_STORE, 'userEmail', user.email);
    await saveToDB(AUTH_STORE, 'companyName', structuredAuthData.companyName);
    
  } catch (error) {
    console.error('Error saving auth data to IndexedDB:', error);
  }
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
    
    await clearAuth();
    
    return null;
  }
);

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
        clearAuth();
      }
    },
    
    initializeAuth: (state) => {
      if (state.isInitialized) {
        return;
      }
      state.isInitialized = true;
    },
    
    forceLogout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.tokenExpiry = null;
      state.error = null;
      state.loginEmail = null;
      clearAuth();
    },
    
    setAuth: (state, action) => {
      const { user, token, refreshToken, loginEmail, tokenExpiry } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.tokenExpiry = tokenExpiry;
      state.lastActivity = Date.now();
      state.loginEmail = loginEmail;
      state.isInitialized = true;
    }
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

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
          saveAuth({ token, refreshToken, user, loginEmail });
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
      
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        const { token, refreshToken } = action.payload;
        const user = getUserFromToken(token, state.loginEmail || undefined);
        
        if (user) {
          state.token = token;
          state.refreshToken = refreshToken || state.refreshToken;
          state.user = user;
          state.tokenExpiry = getTokenExpiry(token);
          state.lastActivity = Date.now();
          
          saveAuth({ 
            token, 
            refreshToken: refreshToken || state.refreshToken, 
            user, 
            loginEmail: state.loginEmail 
          });
        }
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.tokenExpiry = null;
        state.loginEmail = null;
        clearAuth();
      })
      
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.tokenExpiry = null;
        state.isLoading = false;
        state.error = null;
        state.loginEmail = null;
      });
  },
});

export const initializeAuthFromDB = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch, getState }) => {
    try {
      const token = await getFromDB(AUTH_STORE, 'authToken', null) || 
                   await getFromDB(AUTH_STORE, 'accessToken', null);
      const refreshToken = await getFromDB(AUTH_STORE, 'refreshToken', null);
      const loginEmail = await getFromDB(AUTH_STORE, 'loginEmail', null);
      
      if (token && refreshToken && !isTokenExpired(token)) {
        const user = getUserFromToken(token, loginEmail || undefined);
        if (user) {
          dispatch(authSlice.actions.setAuth({user, token, refreshToken, loginEmail,tokenExpiry: getTokenExpiry(token)}));
          return { success: true };
        }
      }
      
      await clearAuth();
      return { success: false };
      
    } catch (error) {
      console.error('Auth initialization error:', error);
      await clearAuth();
      return { success: false };
    }
  }
);

export const { 
  updateActivity, 
  clearError, 
  checkSession, 
  initializeAuth, 
  forceLogout,
  setAuth 
} = authSlice.actions;

export default authSlice.reducer;