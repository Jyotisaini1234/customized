import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BookingState {
  bookingData: any[];
  editModeData: any | null;
  confirmedBooking: any | null;
}

const initialState: BookingState = {
  bookingData: [],
  editModeData: null,
  confirmedBooking: null
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setBookingData: (state, action: PayloadAction<any[]>) => {
      state.bookingData = action.payload;
      console.log('✅ Booking data stored in Redux:', action.payload);
    },
    
    setEditModeData: (state, action: PayloadAction<any>) => {
      state.editModeData = action.payload;
      console.log('✅ Edit mode data stored in Redux:', action.payload);
    },
    
    setConfirmedBooking: (state, action: PayloadAction<any>) => {
      state.confirmedBooking = action.payload;
      console.log('✅ Confirmed booking stored in Redux:', action.payload);
    },
    
    clearBookingData: (state) => {
      state.bookingData = [];
      console.log('✅ Booking data cleared from Redux');
    },
    
    clearEditModeData: (state) => {
      state.editModeData = null;
      console.log('✅ Edit mode data cleared from Redux');
    },
    
    clearConfirmedBooking: (state) => {
      state.confirmedBooking = null;
      console.log('✅ Confirmed booking cleared from Redux');
    },
    
    clearAllBookingState: (state) => {
      state.bookingData = [];
      state.editModeData = null;
      state.confirmedBooking = null;
      console.log('✅ All booking state cleared from Redux');
    }
  }
});

export const {
  setBookingData,
  setEditModeData,
  setConfirmedBooking,
  clearBookingData,
  clearEditModeData,
  clearConfirmedBooking,
  clearAllBookingState
} = bookingSlice.actions;

export default bookingSlice.reducer;