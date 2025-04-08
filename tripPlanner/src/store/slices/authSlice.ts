// authSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const initialState = { user: null, token: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

export default authSlice.reducer;  // Default export
