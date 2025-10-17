import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginCredentials, RegisterData } from '../../types/auth.types.ts';
import { BASE_URL_JWT } from '../../utils/ApiConstants.ts';
import { isTokenExpired, getUserFromToken, getTokenExpiry } from '../../utils/tokenUtils.ts';

interface ExtendedAuthState extends AuthState {
  user: any;
  companyName?: string;
  logoPath?: string;
  userName?: string;
  redirectFrom?: string;
  loginTime?: string;
}

class SessionManager {
  private static SESSION_KEY = '__auth_session__';
  
  private static memoryStorage: Map<string, string> = new Map();
  
  static saveSession(data: any): void {
    try {
      const sessionData = JSON.stringify(data);
      sessionStorage.setItem(this.SESSION_KEY, sessionData);
    } catch (e) {
      this.memoryStorage.set(this.SESSION_KEY, JSON.stringify(data));
    }
  }
  
  static getSession(): any {
    try {
      const data = sessionStorage.getItem(this.SESSION_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      const memData = this.memoryStorage.get(this.SESSION_KEY);
      if (memData) return JSON.parse(memData);
    }
    return null;
  }
  
  static clearSession(): void {
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch (e) {
    }
    this.memoryStorage.delete(this.SESSION_KEY);
  }
}

const loadPersistedState = (): Partial<ExtendedAuthState> => {
  const session = SessionManager.getSession();
  
  if (!session) {
    return {};
  }
  
  if (session.token && isTokenExpired(session.token)) {
    console.log('Persisted token expired, clearing session');
    SessionManager.clearSession();
    return {};
  }
  
  const now = Date.now();
  const lastActivity = session.lastActivity || 0;
  const sessionTimeout = session.sessionTimeout || 30 * 60 * 1000;
  
  if (now - lastActivity > sessionTimeout) {
    console.log('Session expired due to inactivity');
    SessionManager.clearSession();
    return {};
  }
  
  console.log('✅ Restored auth session from storage');
  return {
    ...session,
    isLoading: false,
    error: null,
    isInitialized: true,
    lastActivity: Date.now()
  };
};

const initialState: ExtendedAuthState = {
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
  companyName: '',
  logoPath: '',
  userName: '',
  redirectFrom: '',
  loginTime: '',
  ...loadPersistedState()
};

const persistAuthState = (state: ExtendedAuthState) => {
  if (state.isAuthenticated && state.token) {
    SessionManager.saveSession({
      user: state.user,
      token: state.token,
      refreshToken: state.refreshToken,
      isAuthenticated: state.isAuthenticated,
      tokenExpiry: state.tokenExpiry,
      lastActivity: state.lastActivity,
      sessionTimeout: state.sessionTimeout,
      loginEmail: state.loginEmail,
      companyName: state.companyName,
      logoPath: state.logoPath,
      userName: state.userName,
      loginTime: state.loginTime
    });
  }
};

export const loginUser = createAsyncThunk(
  'auth/login',
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
      const state = getState() as { auth: ExtendedAuthState };
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
      const state = getState() as { auth: ExtendedAuthState };
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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateActivity: (state) => {
      state.lastActivity = Date.now();
      persistAuthState(state);
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    checkSession: (state) => {
      const now = Date.now();
      const isSessionExpired = now - state.lastActivity > state.sessionTimeout;
      
      const tokenExpired = state.token ? isTokenExpired(state.token) : false;
      
      if (isSessionExpired || tokenExpired) {
        console.log('Session expired:', isSessionExpired ? 'Inactivity timeout' : 'Token expired');
        
        SessionManager.clearSession();
        
        Object.assign(state, {
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          tokenExpiry: null,
          lastActivity: Date.now(),
          sessionTimeout: 30 * 60 * 1000,
          isInitialized: true,
          loginEmail: null,
          companyName: '',
          logoPath: '',
          userName: '',
          redirectFrom: '',
          loginTime: '',
        });
        
        window.dispatchEvent(new CustomEvent('sessionExpired', { 
          detail: { reason: isSessionExpired ? 'inactivity' : 'tokenExpired' }
        }));
      }
    },
    
    initializeAuth: (state) => {
      if (state.isInitialized) {
        return;
      }
      
      // Try to restore session on initialization
      const session = SessionManager.getSession();
      if (session && session.token && !isTokenExpired(session.token)) {
        Object.assign(state, session);
        console.log('✅ Auth session restored on initialization');
      }
      
      state.isInitialized = true;
    },
    
    forceLogout: (state) => {
      console.log('Force logout');
      
      SessionManager.clearSession();
      
      Object.assign(state, {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        tokenExpiry: null,
        lastActivity: Date.now(),
        sessionTimeout: 30 * 60 * 1000,
        isInitialized: true,
        loginEmail: null,
        companyName: '',
        logoPath: '',
        userName: '',
        redirectFrom: '',
        loginTime: '',
      });
    },
    
    setAuth: (state, action: PayloadAction<{
      user: any;
      token: string;
      refreshToken: string;
      loginEmail: string | null;
      tokenExpiry: number;
      companyName?: string;
      logoPath?: string;
      userName?: string;
    }>) => {
      const { user, token, refreshToken, loginEmail, tokenExpiry, companyName, logoPath, userName } = action.payload;
      
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.tokenExpiry = tokenExpiry;
      state.lastActivity = Date.now();
      state.loginEmail = loginEmail;
      state.isInitialized = true;
      if (companyName) state.companyName = companyName;
      if (logoPath) state.logoPath = logoPath;
      if (userName) state.userName = userName;
      state.loginTime = new Date().toISOString();
      
      persistAuthState(state);
    },

    setCompanyInfo: (state, action: PayloadAction<{
      companyName?: string;
      logoPath?: string;
      userName?: string;
    }>) => {
      const { companyName, logoPath, userName } = action.payload;
      if (companyName) state.companyName = companyName;
      if (logoPath) state.logoPath = logoPath;
      if (userName) state.userName = userName;
      
      persistAuthState(state);
      
      console.log('Company info updated in Redux state:', { companyName, logoPath, userName });
    },

    setRegistrationSuccess: (state, action: PayloadAction<boolean>) => {
      state.registrationSuccess = action.payload;
    },

    updateFromUrlParams: (state, action: PayloadAction<{
      email?: string;
      companyName?: string;
      logoPath?: string;
      userName?: string;
      authToken?: string;
      refreshToken?: string;
    }>) => {
      const { email, companyName, logoPath, userName, authToken, refreshToken } = action.payload;
      
      console.log('Updating Redux from URL params:', action.payload);
      
      if (email && email !== state.loginEmail) {
        state.loginEmail = email;
        if (state.user) {
          state.user = { ...state.user, email };
        }
      }
      if (companyName && companyName !== state.companyName) {
        state.companyName = companyName;
      }
      if (logoPath && logoPath !== state.logoPath) {
        state.logoPath = logoPath;
      }
      if (userName && userName !== state.userName) {
        state.userName = userName;
      }
      
      if (authToken && authToken !== state.token) {
        state.token = authToken;
        if (!isTokenExpired(authToken)) {
          const user = getUserFromToken(authToken, email);
          if (user) {
            state.user = user;
            state.isAuthenticated = true;
            state.tokenExpiry = getTokenExpiry(authToken);
          }
        }
      }
      if (refreshToken && refreshToken !== state.refreshToken) {
        state.refreshToken = refreshToken;
      }
      
      persistAuthState(state);
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
          state.loginTime = new Date().toISOString();
          
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            if (tokenPayload.companyName) {
              state.companyName = tokenPayload.companyName;
            }
            if (tokenPayload.logoPath) {
              state.logoPath = tokenPayload.logoPath;
            }
            if (tokenPayload.sub) {
              state.userName = tokenPayload.sub;
            }
            console.log('Token payload extracted and stored in Redux:', { 
              companyName: tokenPayload.companyName,
              logoPath: tokenPayload.logoPath,
              userName: tokenPayload.sub 
            });
          } catch (error) {
            console.error('Error extracting token payload:', error);
          }
          
          // Persist to session storage
          persistAuthState(state);
          
          setTimeout(() => {
            const authData = {
              token,
              refreshToken,
              email: loginEmail,
              companyName: state.companyName,
              logoPath: state.logoPath,
              userName: state.userName,
              isAuthenticated: true,
              source: 'authSlice'
            };
            
            console.log('Dispatching authUpdated event from Redux slice:', authData);
            window.dispatchEvent(new CustomEvent('authUpdated', { detail: authData }));
          }, 100);
          
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
        state.registrationSuccess = true;
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
          
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            if (tokenPayload.companyName) {
              state.companyName = tokenPayload.companyName;
            }
            if (tokenPayload.logoPath) {
              state.logoPath = tokenPayload.logoPath;
            }
            if (tokenPayload.sub) {
              state.userName = tokenPayload.sub;
            }
          } catch (error) {
            console.error('Error extracting token payload on refresh:', error);
          }
          
          // Persist updated tokens
          persistAuthState(state);
          
          const authData = {
            token,
            refreshToken: refreshToken || state.refreshToken,
            email: state.loginEmail,
            companyName: state.companyName,
            logoPath: state.logoPath,
            userName: state.userName,
            isAuthenticated: true,
            source: 'tokenRefresh'
          };
          
          console.log('Token refreshed, dispatching authUpdated event:', authData);
          window.dispatchEvent(new CustomEvent('authUpdated', { detail: authData }));
        }
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        console.log('Token refresh failed');
        
        SessionManager.clearSession();
        
        Object.assign(state, {
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          tokenExpiry: null,
          lastActivity: Date.now(),
          sessionTimeout: 30 * 60 * 1000,
          isInitialized: true,
          loginEmail: null,
          companyName: '',
          logoPath: '',
          userName: '',
          redirectFrom: '',
          loginTime: '',
        });
      })
      
      .addCase(logoutUser.fulfilled, (state) => {
        console.log('Logout successful');
        
        SessionManager.clearSession();
        
        Object.assign(state, {
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          tokenExpiry: null,
          lastActivity: Date.now(),
          sessionTimeout: 30 * 60 * 1000,
          isInitialized: true,
          loginEmail: null,
          companyName: '',
          logoPath: '',
          userName: '',
          redirectFrom: '',
          loginTime: '',
        });
      });
  },
});

export const {
  updateActivity,
  clearError,
  checkSession,
  initializeAuth,
  forceLogout,
  setAuth,
  setCompanyInfo,
  setRegistrationSuccess,
  updateFromUrlParams
} = authSlice.actions;

export default authSlice.reducer;