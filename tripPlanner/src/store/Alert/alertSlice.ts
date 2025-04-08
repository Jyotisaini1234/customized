import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AlertActions } from '../../services/uiServices/alert.interface';

interface AlertState {
  show: boolean;
  title: string;
  messages: string[];
  actions: AlertActions[];
}

const initialState: AlertState = {
  show: false,
  title: '',
  messages: [],
  actions: [],
};

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    showAlert: (state, action: PayloadAction<AlertState>) => {
      state.show = action.payload.show;
      state.title = action.payload.title;
      state.messages = action.payload.messages;
      state.actions = action.payload.actions;
    },
    clearAlert: (state) => {
      state.show = false;
      state.title = '';
      state.messages = [];
      state.actions = [];
    },
  },
});

export const { showAlert, clearAlert } = alertSlice.actions;
export const alertReducer = alertSlice.reducer;

