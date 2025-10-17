// 1. Redux Slice - hotelTransferSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface HotelSearchData {
  checkInDate: string;
  checkOutDate: string;
  city: string;
  country: string;
  nights: number;
  adults: number;
  cwb: number;
  cnb: number;
  infants: number;
  rooms: any[];
  fromTripPlanner: boolean;
  specificDayId?: string;
  bookingRef?: string;
  fromReadymadePackage?: boolean;
}

interface HotelData {
  hotel: {
    id: string;
    hotelName: string;
    starRating: number;
    city: string;
  };
  room: {
    roomCategory: string;
    mealPlan: string;};
  booking: {
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    totalPrice: number;
  };
  uniqueId: string;
  dayId?: string;
}

interface HotelTransferState {
  searchData: HotelSearchData | null;
  hotelData: HotelData | null;
  isSearchPending: boolean;
  isHotelPending: boolean;
}

const initialState: HotelTransferState = {
  searchData: null,
  hotelData: null,
  isSearchPending: false,
  isHotelPending: false
};

const hotelTransferSlice = createSlice({
  name: 'hotelTransfer',
  initialState,
  reducers: {
    setSearchData: (state, action: PayloadAction<HotelSearchData>) => {
      state.searchData = action.payload;
      state.isSearchPending = true;
    },
    setHotelData: (state, action: PayloadAction<HotelData>) => {
      state.hotelData = action.payload;
      state.isHotelPending = true;
    },
    consumeSearchData: (state) => {
      state.isSearchPending = false;
    },
    consumeHotelData: (state) => {
      state.isHotelPending = false;
    },
    clearAll: (state) => {
      state.searchData = null;
      state.hotelData = null;
      state.isSearchPending = false;
      state.isHotelPending = false;
    }
  }
});

export const { setSearchData, setHotelData, consumeSearchData, consumeHotelData, clearAll } = hotelTransferSlice.actions;
export default hotelTransferSlice.reducer;