import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userEmail: string;
  isLoading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  userEmail: 'Guest',
  isLoading: true,
};

const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp < currentTime) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initializeAuth: (state) => {
      const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
      const userEmail = localStorage.getItem('username') || 'Guest';
      
      if (token && isTokenValid(token)) {
        state.isAuthenticated = true;
        state.token = token;
        state.userEmail = userEmail;
      } else {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        state.isAuthenticated = false;
        state.token = null;
        state.userEmail = 'Guest';
      }
      state.isLoading = false;
    },
    
    login: (state, action: PayloadAction<{ token: string; email: string }>) => {
      const { token, email } = action.payload;
      
      if (isTokenValid(token)) {
        state.isAuthenticated = true;
        state.token = token;
        state.userEmail = email;
        
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('username', email);
      }
    },
    
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.userEmail = 'Guest';
      
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      
      window.location.href = 'http://b2b.flydivinetravels.com/hotel';
    },
    
    checkTokenValidity: (state) => {
      if (!isTokenValid(state.token)) {
        state.isAuthenticated = false;
        state.token = null;
        state.userEmail = 'Guest';
        
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        
        window.location.href = 'https://b2b.flydivinetravels.com';
      }
    }
  },
});

export const { initializeAuth, login, logout, checkTokenValidity } = authSlice.actions;
export default authSlice.reducer;