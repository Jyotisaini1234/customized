import { createSlice } from '@reduxjs/toolkit';

const loaderSlice = createSlice({
  name: 'loader',
  initialState: {
    isLoading: false,
    oMessage : 'Please wait...'
  },
  reducers: {
    startLoading: (state,action) => {
      state.isLoading = true;
      state.oMessage = action.payload || 'Please wait...';
    },
    stopLoading: (state) => {
      state.isLoading = false;
    },
  },
});

export const { startLoading, stopLoading } = loaderSlice.actions;

export const loaderReducer =loaderSlice.reducer;