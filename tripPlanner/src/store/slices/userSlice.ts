import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  companyName: string | null;
  logoPath: string | null;
  userRole: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  companyName: null,
  logoPath: null,
  userRole: 'USER',
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUserError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCompanyInfo: (state, action: PayloadAction<{
      companyName?: string;
      logoPath?: string;
    }>) => {
      if (action.payload.companyName) state.companyName = action.payload.companyName;
      if (action.payload.logoPath) state.logoPath = action.payload.logoPath;
    },
    setUserRole: (state, action: PayloadAction<string>) => {
      state.userRole = action.payload;
    },
    clearUserData: (state) => {
      state.companyName = null;
      state.logoPath = null;
      state.userRole = 'USER';
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setUserLoading,
  setUserError,
  setCompanyInfo,
  setUserRole,
  clearUserData,
} = userSlice.actions;

export default userSlice.reducer;
