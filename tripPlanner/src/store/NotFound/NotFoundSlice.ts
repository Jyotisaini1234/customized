import { createSlice } from '@reduxjs/toolkit';


const notFoundSlice = createSlice({
  name: 'notFound',
  initialState: {
    show: false,
    noDataStatus:false,
    backdropUrl:'',
    errorMsg:''

  },
  reducers: {
    setNotFound: (state,action) => {
      state.show =action.payload.show;
      state.noDataStatus=action.payload.noDataStatus
      state.backdropUrl = action.payload.backdropUrl || state.backdropUrl
      state.errorMsg=action.payload.errorMsg
    },
    resetNotFound: (state) => {
      state.show = false;
      state.noDataStatus = false;
      state.backdropUrl = ''
      state.errorMsg=''
    }
  },
});

export const { setNotFound, resetNotFound } = notFoundSlice.actions;

export const notFoundReducer = notFoundSlice.reducer;
