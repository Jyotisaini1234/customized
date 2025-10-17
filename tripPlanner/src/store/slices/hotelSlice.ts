
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlannerItem } from '../../types/types.ts';
import { Hotel } from '../../types/hotel.types.ts';

interface SearchDetails {
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  city: string;
  country: string;
  rooms: any[];
  packageType: string;
  [key: string]: any;
}

interface HotelState {
  selectedHotel: any;
  allHotels: [];
  hotelDetails: Hotel[];
  bookingData: any;
  plannerItems: PlannerItem[];
  searchParams: any;
  searchParamsHistory: any[];
  searchDetails: SearchDetails | null;
  totals: {
    hotelTotal: number;
    tourTotal: number;
    grandTotal: number;
    currency: string;
  };
  // New properties for better state management
  isSearching: boolean;
  lastSearchTimestamp: number;
  filteredHotels: any[];
}

const initialState: HotelState = {
  hotelDetails: [],
  bookingData: null,
  plannerItems: [],
  searchParams: null,
  searchParamsHistory: [],
  searchDetails: null,
  totals: {
    hotelTotal: 0,
    tourTotal: 0,
    grandTotal: 0,
    currency: 'USD'
  },
  allHotels: [],
  selectedHotel: undefined,
  isSearching: false,
  lastSearchTimestamp: 0,
  filteredHotels: []
};

const hotelSlice = createSlice({
  name: 'hotel',
  initialState,
  reducers: {
    setHotelDetails: (state, action: PayloadAction<any[]>) => {
      if (Array.isArray(action.payload)) {
        state.hotelDetails = action.payload;
        console.log('Redux Hotel: Hotel details set (array):', action.payload.length, 'hotels');
      } else if (action.payload) {
        state.hotelDetails = [action.payload];
        // console.log('Redux Hotel: Hotel details set (single):', action.payload.hotel?.hotelName || 'Unknown');
      } else {
        state.hotelDetails = [];
        console.log('Redux Hotel: Hotel details cleared');
      }
    },

    setBookingData: (state, action: PayloadAction<any>) => {
      state.bookingData = action.payload;
      console.log('Redux Hotel: Booking data set');
    },

    setPlannerItems: (state, action: PayloadAction<PlannerItem[]>) => {
      state.plannerItems = action.payload;
      console.log('Redux Hotel: Planner items set:', action.payload?.length || 0);
    },

    setSearchDetails: (state, action: PayloadAction<SearchDetails>) => {
      state.searchDetails = action.payload;
      state.lastSearchTimestamp = Date.now();
      console.log("Redux Hotel: Search details set:", {
        city: action.payload.city,
        country: action.payload.country,
        checkInDate: action.payload.checkInDate,
        nights: action.payload.nights,
        rooms: action.payload.rooms?.length || 0
      });
    },

    // Add or update a single hotel with enhanced logic
    addHotel: (state, action: PayloadAction<Hotel>) => {
      const existingIndex = state.hotelDetails.findIndex(
        hotel => hotel.uniqueId === action.payload.uniqueId
      );
      
      if (existingIndex !== -1) {
        // Update existing hotel
        state.hotelDetails[existingIndex] = action.payload;
        console.log('Redux Hotel: Hotel updated:', action.payload.uniqueId);
      } else {
        // Add new hotel
        state.hotelDetails.push(action.payload);
        console.log('Redux Hotel: New hotel added:', action.payload.uniqueId);
      }
    },

    // Remove a hotel by uniqueId with cleanup
    removeHotel: (state, action: PayloadAction<string>) => {
      const initialLength = state.hotelDetails.length;
      
      // Remove hotel from hotelDetails array
      state.hotelDetails = state.hotelDetails.filter(
        hotel => hotel.uniqueId !== action.payload
      );
      
      // Also remove hotel from planner items
      state.plannerItems = state.plannerItems.map(item => {
        if (item.hotel?.details?.uniqueId === action.payload) {
          return { ...item, hotel: null };
        }
        return item;
      });
      
      // Remove from selected hotel if it matches
      if (state.selectedHotel?.uniqueId === action.payload) {
        state.selectedHotel = undefined;
      }
      
      console.log('Redux Hotel: Hotel removed:', action.payload, 
        'Removed count:', initialLength - state.hotelDetails.length);
    },

    // Clear all hotels with comprehensive cleanup
    clearHotels: (state) => {
      const hotelCount = state.hotelDetails.length;
      state.hotelDetails = [];
      state.selectedHotel = undefined;
      state.filteredHotels = [];
      
      // Clear hotels from planner items as well
      state.plannerItems = state.plannerItems.map(item => ({
        ...item,
        hotel: null
      }));
      
      // Reset hotel-related totals
      state.totals = {
        ...state.totals,
        hotelTotal: 0,
        grandTotal: state.totals.tourTotal // Keep tour total, reset grand total to tour total only
      };
      
      console.log('Redux Hotel: All hotels cleared. Previous count:', hotelCount);
    },

    // Update hotel assignment for a specific planner item
    updatePlannerItemHotel: (state, action: PayloadAction<{itemId: string, hotel: any}>) => {
      const itemIndex = state.plannerItems.findIndex(item => item.id === action.payload.itemId);
      if (itemIndex !== -1) {
        state.plannerItems[itemIndex].hotel = action.payload.hotel;
        console.log('Redux Hotel: Hotel assigned to planner item:', action.payload.itemId);
      } else {
        console.log('Redux Hotel: Planner item not found:', action.payload.itemId);
      }
    },

    // Update tour assignment for a specific planner item
    updatePlannerItemTour: (state, action: PayloadAction<{itemId: string, tour: any}>) => {
      const itemIndex = state.plannerItems.findIndex(item => item.id === action.payload.itemId);
      if (itemIndex !== -1) {
        state.plannerItems[itemIndex].tours = action.payload.tour;
        console.log('Redux Hotel: Tour assigned to planner item:', action.payload.itemId);
      } else {
        console.log('Redux Hotel: Planner item not found for tour assignment:', action.payload.itemId);
      }
    },

    // Remove tour from a specific planner item
    removeTourFromPlannerItem: (state, action: PayloadAction<string>) => {
      const itemIndex = state.plannerItems.findIndex(item => item.id === action.payload);
      if (itemIndex !== -1) {
        state.plannerItems[itemIndex].tours = null;
        console.log('Redux Hotel: Tour removed from planner item:', action.payload);
      }
    },

    // Set search parameters with history tracking
    setSearchParams: (state, action: PayloadAction<any>) => {
      // Add current params to history before updating
      if (state.searchParams) {
        state.searchParamsHistory.push({
          ...state.searchParams,
          timestamp: Date.now()
        });
      }
      
      state.searchParams = action.payload;
      console.log('Redux Hotel: Search params updated');
    },

    // Update totals with validation
    updateTotals: (state, action: PayloadAction<{
      hotelTotal: number;
      tourTotal: number;
      grandTotal: number;
      currency: string;
    }>) => {
      state.totals = {
        hotelTotal: action.payload.hotelTotal || 0,
        tourTotal: action.payload.tourTotal || 0,
        grandTotal: action.payload.grandTotal || 0,
        currency: action.payload.currency || 'USD'
      };
      console.log('Redux Hotel: Totals updated - Grand Total:', action.payload.grandTotal, action.payload.currency);
    },

    // Set searching state
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
      console.log('Redux Hotel: Search state set to:', action.payload);
    },

    // Set filtered hotels
    setFilteredHotels: (state, action: PayloadAction<any[]>) => {
      state.filteredHotels = action.payload || [];
      console.log('Redux Hotel: Filtered hotels set:', action.payload?.length || 0);
    },

    // Clear all data (for new search) with better reset
    clearAllData: (state) => {
      console.log('Redux Hotel: Clearing all data for new search');
      return {
        ...initialState,
        // Preserve search history if needed
        searchParamsHistory: state.searchParamsHistory
      };
    },

    // Add multiple hotels at once with deduplication
    addMultipleHotels: (state, action: PayloadAction<Hotel[]>) => {
      const addedCount = { updated: 0, added: 0 };
      
      action.payload.forEach(hotel => {
        const existingIndex = state.hotelDetails.findIndex(
          h => h.uniqueId === hotel.uniqueId
        );
        
        if (existingIndex !== -1) {
          state.hotelDetails[existingIndex] = hotel;
          addedCount.updated++;
        } else {
          state.hotelDetails.push(hotel);
          addedCount.added++;
        }
      });
      
      console.log('Redux Hotel: Multiple hotels processed - Added:', addedCount.added, 'Updated:', addedCount.updated);
    },

    // Update specific hotel booking details
    updateHotelBooking: (state, action: PayloadAction<{
      hotelId: string;
      bookingData: any;
    }>) => {
      const hotelIndex = state.hotelDetails.findIndex(
        hotel => hotel.uniqueId === action.payload.hotelId
      );
      
      if (hotelIndex !== -1) {
        state.hotelDetails[hotelIndex].booking = {
          ...state.hotelDetails[hotelIndex].booking,
          ...action.payload.bookingData
        };
        console.log('Redux Hotel: Hotel booking updated:', action.payload.hotelId);
      } else {
        console.log('Redux Hotel: Hotel not found for booking update:', action.payload.hotelId);
      }
    },

    // Set search history (replace existing)
    setSearchHistory: (state, action: PayloadAction<any[]>) => {
      state.searchParamsHistory = action.payload || [];
      console.log('Redux Hotel: Search history set:', action.payload?.length || 0, 'entries');
    },

    // Add to search history
    addToSearchHistory: (state, action: PayloadAction<any>) => {
      const newEntry = {
        ...action.payload,
        timestamp: Date.now()
      };
      
      // Avoid duplicates based on key search criteria
      const isDuplicate = state.searchParamsHistory.some(entry => 
        entry.city === newEntry.city &&
        entry.country === newEntry.country &&
        entry.checkInDate === newEntry.checkInDate &&
        entry.checkOutDate === newEntry.checkOutDate
      );
      
      if (!isDuplicate) {
        state.searchParamsHistory.push(newEntry);
        // Keep only last 10 searches
        if (state.searchParamsHistory.length > 10) {
          state.searchParamsHistory = state.searchParamsHistory.slice(-10);
        }
      }
      
      console.log('Redux Hotel: Added to search history. Total entries:', state.searchParamsHistory.length);
    },

    // Clear search history
    clearSearchHistory: (state) => {
      const count = state.searchParamsHistory.length;
      state.searchParamsHistory = [];
      console.log('Redux Hotel: Search history cleared. Previous count:', count);
    },

    // Sync with trip planner data
    syncWithTripPlanner: (state, action: PayloadAction<{
      hotels?: any[];
      plannerItems?: any[];
      searchParams?: any;
    }>) => {
      if (action.payload.hotels) {
        state.hotelDetails = action.payload.hotels;
      }
      if (action.payload.plannerItems) {
        state.plannerItems = action.payload.plannerItems;
      }
      if (action.payload.searchParams) {
        state.searchParams = action.payload.searchParams;
      }
      
      console.log('Redux Hotel: Synced with trip planner data');
    },

    // Update selected hotel
    setSelectedHotel: (state, action: PayloadAction<any>) => {
      state.selectedHotel = action.payload;
      console.log('Redux Hotel: Selected hotel set:', action.payload?.uniqueId || 'cleared');
    }
   
  }
});
export const { 
  setHotelDetails, 
  setBookingData, 
  setPlannerItems, 
  addHotel, 
  removeHotel, 
  clearHotels,
  updatePlannerItemHotel,
  updatePlannerItemTour,
  removeTourFromPlannerItem,
  setSearchParams,
  updateTotals,
  setSearching,
  setFilteredHotels,
  clearAllData,
  addMultipleHotels,
  updateHotelBooking,
  setSearchDetails,
  setSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
  syncWithTripPlanner,
  setSelectedHotel
} = hotelSlice.actions;

export const selectHotels = (state: { hotel: HotelState }) => state.hotel.hotelDetails;
export const selectPlannerItems = (state: { hotel: HotelState }) => state.hotel.plannerItems;
export const selectBookingData = (state: { hotel: HotelState }) => state.hotel.bookingData;
export const selectSearchParams = (state: { hotel: HotelState }) => state.hotel.searchParams;
export const selectTotals = (state: { hotel: HotelState }) => state.hotel.totals;
export const selectSearchDetails = (state: { hotel: HotelState }) => state.hotel.searchDetails;
export const selectSelectedHotel = (state: { hotel: HotelState }) => state.hotel.selectedHotel;
export const selectIsSearching = (state: { hotel: HotelState }) => state.hotel.isSearching;
export const selectFilteredHotels = (state: { hotel: HotelState }) => state.hotel.filteredHotels;
export const selectSearchHistory = (state: { hotel: HotelState }) => state.hotel.searchParamsHistory;
export const selectLastSearchTimestamp = (state: { hotel: HotelState }) => state.hotel.lastSearchTimestamp;

export const selectHotelCount = (state: { hotel: HotelState }) => state.hotel.hotelDetails.length;
export const selectHasHotels = (state: { hotel: HotelState }) => state.hotel.hotelDetails.length > 0;
export const selectCurrentSearchSummary = (state: { hotel: HotelState }) => {
  const details = state.hotel.searchDetails;
  if (!details) return null;
  
  return {
    destination: `${details.city}, ${details.country}`,
    dates: `${details.checkInDate} to ${details.checkOutDate}`,
    nights: details.nights,
    rooms: details.rooms?.length || 0,
    guests: details.rooms?.reduce((total, room) => total + (room.adults || 0), 0) || 0
  };
};

export default hotelSlice.reducer;
