import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PlannerItem } from "../../types/types";

interface Room {
  id: number;
  adults: number;
  cwb: number;
  cnb: number;
  infants: number;
}

interface Tour {
  specificDayId: string;
  date: string;
  tourId: string;
  tours: {
    name: string;
    details: any;
    uniqueId?: string; 
  };
  sessionId: string;
  fromTripPlanner?: boolean;
  addedToPlanner?: boolean;
  timestamp?: number;
}

interface TripPlannerState {
  editModeData: any;
  sessionId: string;
  country: string;
  city: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  rooms: Room[];
  packageType: string;
  isNewSearch: boolean;
  searchTimestamp: number;
  filteredHotels: any[];
  hotels: any[];
  tours: Tour[]; 
  plannerItems: any[];
  grandTotal: number;
  selectedHotel: any | null;
  currentSearchParams: any | null;
  editMode: {
    isEditMode: false,
    leadId: null,
    leadData: null,
    originalHotels: [],
    originalPlannerItems: [],
    originalSearchParams: null,
    clientData: null
  }
}

const initialState: TripPlannerState = {
  country: "",
  city: "",
  checkInDate: "",
  checkOutDate: "",
  nights: 0,
  rooms: [],
  packageType: "hotel-land",
  isNewSearch: false,
  searchTimestamp: 0,
  filteredHotels: [],
  hotels: [],
  tours: [],
  plannerItems: [],
  grandTotal: 0,
  selectedHotel: null,
  currentSearchParams: null,
  sessionId: '',
  editMode: {
    isEditMode: false,
    leadId: null,
    leadData: null,
    originalHotels: [],
    originalPlannerItems: [],
    originalSearchParams: null,
    clientData: null
  },
  editModeData: undefined
};

const tripPlannerSlice = createSlice({
  name: "tripPlanner",
  initialState,
  reducers: {
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    setTripPlannerParams: (state, action: PayloadAction<Partial<TripPlannerState>>) => {
      console.log('Redux: Setting trip planner params', action.payload);
      
      return {
        ...state,
        ...action.payload,
        hotels: action.payload.hotels !== undefined ? action.payload.hotels : state.hotels,
        tours: action.payload.tours !== undefined ? action.payload.tours : state.tours, // NEW
        plannerItems: action.payload.plannerItems !== undefined ? action.payload.plannerItems : state.plannerItems,
        searchTimestamp: action.payload.searchTimestamp || Date.now(),
      };
    },
    clearTripPlannerParams: () => {
      console.log('Redux: Clearing trip planner params');
      return initialState;
    },

    setHotels: (state, action: PayloadAction<any[]>) => {
      console.log('Redux: Setting hotels', action.payload?.length || 0);
      state.hotels = action.payload || [];
    },

    addHotel: (state, action: PayloadAction<any>) => {
      console.log('Redux: Adding hotel', action.payload?.hotel?.hotelName);
      
      if (!action.payload) return;
      
      const existingIndex = state.hotels.findIndex(
        h => h.uniqueId === action.payload.uniqueId || 
             (h.hotel?.hotelName === action.payload.hotel?.hotelName && 
              h.specificDayId === action.payload.specificDayId)
      );
      
      if (existingIndex !== -1) {
        state.hotels[existingIndex] = action.payload;
        console.log('Redux: Updated existing hotel');
      } else {
        state.hotels.push(action.payload);
        console.log('Redux: Added new hotel');
      }
    },

    removeHotel: (state, action: PayloadAction<string>) => {
      const uniqueId = action.payload;
      console.log('Redux: Removing hotel', uniqueId);
      
      const beforeCount = state.hotels.length;
      state.hotels = state.hotels.filter(hotel => hotel.uniqueId !== uniqueId);
      const afterCount = state.hotels.length;
      
      console.log(`Redux: Removed ${beforeCount - afterCount} hotels`);

      state.plannerItems = state.plannerItems.map(item => {
          if (item.hotel?.details?.uniqueId === uniqueId) {
              return {
                  ...item,
                  hotel: null,
                  lastUpdated: Date.now()
              };
          }
          return item;
      });
  },


    setTours: (state, action: PayloadAction<Tour[]>) => {
      console.log('Redux: Setting tours', action.payload?.length || 0);
      state.tours = action.payload || [];
    },

    removeTourFromDay: (state, action: PayloadAction<string>) => {
      const specificDayId = action.payload;
      console.log('Redux: Removing all tours from day:', specificDayId);
      
      // Remove from tours array
      state.tours = state.tours.filter(tour => tour.specificDayId !== specificDayId);
      
      // Remove from planner items
      state.plannerItems = state.plannerItems.map(item => {
          if (item.id === specificDayId || item.specificDayId === specificDayId) {
              return {
                  ...item,
                  tours: null,
                  lastUpdated: Date.now()
              };
          }
          return item;
      });
      
      console.log('Redux: Tours removed from day:', specificDayId);
  },
    

    updateTourForDay: (state, action: PayloadAction<{specificDayId: string, tourData: Partial<Tour>}>) => {
      console.log('Redux: Updating tour for day', action.payload.specificDayId);
      
      const { specificDayId, tourData } = action.payload;
      
      // Update in tours array
      const tourIndex = state.tours.findIndex(tour => tour.specificDayId === specificDayId);
      if (tourIndex !== -1) {
        state.tours[tourIndex] = { ...state.tours[tourIndex], ...tourData };
        console.log('Redux: Tour updated in tours array');
      } else {
        const newTour: Tour = {
          specificDayId,
          date: tourData.date || '',
          tours: tourData.tours || { name: '', details: {} },
          tourId:'',
          sessionId: tourData.sessionId || state.sessionId,
          ...tourData
        };
        state.tours.push(newTour);
        console.log('Redux: Created new tour entry');
      }
      
      const plannerItemIndex = state.plannerItems.findIndex(
        item => item.id === specificDayId || item.specificDayId === specificDayId
      );
      
      if (plannerItemIndex !== -1) {
        state.plannerItems[plannerItemIndex] = {
          ...state.plannerItems[plannerItemIndex],
          tours: tourData.tours
        };
        console.log('Redux: Updated planner item with tour data');
      }
    },
    removeAllToursFromDay: (state, action: PayloadAction<string>) => {
      const specificDayId = action.payload;
      console.log('Redux: Removing all tours from day', specificDayId);
      const initialLength = state.tours.length;
      state.tours = state.tours.filter(tour => tour.specificDayId !== specificDayId);
      console.log(`Redux: Removed ${initialLength - state.tours.length} tours`);
      const plannerItemIndex = state.plannerItems.findIndex(
        item => item.id === specificDayId || item.specificDayId === specificDayId
      );
      
      if (plannerItemIndex !== -1) {
        state.plannerItems[plannerItemIndex] = {
          ...state.plannerItems[plannerItemIndex],
          tours: null
        };
        console.log('Redux: Cleared tours from planner item');
      }
    },

    // setPlannerItems: (state, action: PayloadAction<PlannerItem[]>) => {
    //   const newItems = action.payload;
      
    //   // Existing tours ko preserve karo
    //   const updatedItems = newItems.map(newItem => {
    //     const existingItem = state.plannerItems.find(item => item.id === newItem.id);
        
    //     if (existingItem && existingItem.tours && !newItem.tours) {
    //       // Agar existing item mein tours hain aur new item mein nahi, to preserve karo
    //       return {
    //         ...newItem,
    //         tours: existingItem.tours
    //       };
    //     }
        
    //     return newItem;
    //   });
      
    //   state.plannerItems = updatedItems;
    //   console.log('Redux: Setting planner items', updatedItems.length);
    // },
    setPlannerItems: (state, action: PayloadAction<PlannerItem[]>) => {
      const newItems = action.payload;
      console.log('Redux: Setting planner items', newItems.length);
      
      // Preserve existing tours and hotels when updating planner items
      const updatedItems = newItems.map(newItem => {
        const existingItem = state.plannerItems.find(item => item.id === newItem.id);
        
        if (existingItem) {
          // Merge existing data with new data
          return {
            ...newItem,
            // Preserve tours if new item doesn't have them but existing does
            tours: newItem.tours !== undefined ? newItem.tours : existingItem.tours,
            // Preserve hotel if new item doesn't have it but existing does
            hotel: newItem.hotel !== undefined ? newItem.hotel : existingItem.hotel,
            // Preserve other data
            transfer: newItem.transfer !== undefined ? newItem.transfer : existingItem.transfer,
            meals: newItem.meals !== undefined ? newItem.meals : existingItem.meals,
            lastUpdated: Date.now()
          };
        }
        
        return newItem;
      });
      
      state.plannerItems = updatedItems;
      console.log('Redux: Planner items updated with preserved data');
    },
    

    updatePlannerItem: (state, action: PayloadAction<{itemId: string, updates: any}>) => {
      console.log('Redux: Updating planner item', action.payload?.itemId);
      
      const { itemId, updates } = action.payload;
      if (!itemId) return;
      
      const index = state.plannerItems.findIndex(p => 
        p.id === itemId || p.specificDayId === itemId
      );
      
      if (index !== -1) {
        state.plannerItems[index] = {
          ...state.plannerItems[index],
          ...updates,
          lastUpdated: Date.now()
        };
        console.log('Redux: Planner item updated');
      } else {
        console.log('Redux: Planner item not found for update');
      }
    },
    addTourToPlannerItem: (state, action: PayloadAction<{itemId: string, tour: any}>) => {
      console.log('Redux: Adding tour to planner item (legacy)', action.payload.itemId);
      
      const index = state.plannerItems.findIndex(p => p.id === action.payload.itemId);
      if (index !== -1) {
        state.plannerItems[index] = {
          ...state.plannerItems[index],
          tours: action.payload.tour
        };
        console.log('Redux: Tour added to planner item');
      }
    },
    addTour: (state, action: PayloadAction<any>) => {
      const { specificDayId, tours, date, sessionId } = action.payload;
      console.log('Redux: Adding tour for day', specificDayId, 'Tour data:', tours);
      if (!tours.uniqueId && !tours.details?.uniqueId) {
        console.error('Tour missing uniqueId!', tours);
      }
      const existingTourIndex = state.tours.findIndex(
        tour => tour.specificDayId === specificDayId && 
                (tour.tours?.uniqueId === tours?.uniqueId || 
                 tour.tours?.details?.uniqueId === tours?.details?.uniqueId)
      );
      
      if (existingTourIndex !== -1) {
        state.tours[existingTourIndex] = {
          ...state.tours[existingTourIndex],
          tours,
          date,
          sessionId,
          timestamp: Date.now()
        };
        console.log('Redux: Updated existing tour');
      } else {
        state.tours.push({
          specificDayId,
          date,
          tours,
          sessionId,
          fromTripPlanner: true,
          addedToPlanner: true,
          timestamp: Date.now(),
          tourId: ""
        });
        console.log('Redux: Added new tour');
      }
      
      // Update planner items
      const plannerItemIndex = state.plannerItems.findIndex(
        item => item.id === specificDayId
      );
      
      if (plannerItemIndex !== -1) {
        const currentItem = state.plannerItems[plannerItemIndex];
        const existingTours = currentItem.tours;
        
        let updatedTours;
        if (Array.isArray(existingTours)) {
          const tourExists = existingTours.some(
            t => (t.uniqueId && t.uniqueId === tours.uniqueId) || 
                 (t.details?.uniqueId && t.details.uniqueId === tours.details?.uniqueId)
          );
          
          if (!tourExists) {
            updatedTours = [...existingTours, tours];
            console.log('Redux: Appended tour to array, total:', updatedTours.length);
          } else {
            updatedTours = existingTours;
            console.log('Redux: Tour duplicate, skipped');
          }
        } else if (existingTours) {
          updatedTours = [existingTours, tours];
          console.log('Redux: Converted single tour to array');
        } else {
          updatedTours = tours;
          console.log('Redux: Set first tour for this day');
        }
        
        state.plannerItems[plannerItemIndex] = {
          ...currentItem,
          tours: updatedTours,
          lastUpdated: Date.now()
        };
      }
    },


    removeTour: (state, action: PayloadAction<string>) => {
      console.log('Redux: Removing tour from planner item (legacy)', action.payload);
      
      const index = state.plannerItems.findIndex(p => p.id === action.payload);
      if (index !== -1) {
        state.plannerItems[index] = {
          ...state.plannerItems[index],
          tours: null
        };
        console.log('Redux: Tour removed from planner item');
      }
    },

    setGrandTotal: (state, action: PayloadAction<number>) => {
      console.log('Redux: Setting grand total', action.payload);
      state.grandTotal = action.payload || 0;
    },

    setSelectedHotel: (state, action: PayloadAction<any>) => {
      console.log('Redux: Setting selected hotel', action.payload?.hotel?.hotelName);
      state.selectedHotel = action.payload;
    },

    setCurrentSearchParams: (state, action) => {
      state.currentSearchParams = {
        ...state.currentSearchParams,
        ...action.payload,
      };
    },

    updateSearchParams: (state, action: PayloadAction<Partial<any>>) => {
      console.log('Redux: Updating search params', action.payload);
      
      state.currentSearchParams = {
        ...state.currentSearchParams,
        ...action.payload
      };
      
      if (action.payload.country) state.country = action.payload.country;
      if (action.payload.city) state.city = action.payload.city;
      if (action.payload.checkInDate) state.checkInDate = action.payload.checkInDate;
      if (action.payload.checkOutDate) state.checkOutDate = action.payload.checkOutDate;
      if (action.payload.nights) state.nights = action.payload.nights;
      if (action.payload.rooms) state.rooms = action.payload.rooms;
      if (action.payload.packageType) state.packageType = action.payload.packageType;
    },

    resetHotelsAndPlannerItems: (state) => {
      console.log('Redux: Resetting hotels and planner items');
      state.hotels = [];
      state.tours = []; // NEW: Also reset tours
      state.plannerItems = [];
      state.grandTotal = 0;
      state.selectedHotel = null;
      state.isNewSearch = true;
      state.searchTimestamp = Date.now();
    },

    // NEW: Clear all session data
    clearSessionData: (state) => {
      console.log('Redux: Clearing all session data');
      state.hotels = [];
      state.tours = [];
      state.plannerItems = [];
      state.grandTotal = 0;
      state.selectedHotel = null;
    },

    markSearchAsProcessed: (state) => {
      state.isNewSearch = false;
    },

    setEditModeData: (state, action) => {
      console.log('🔧 Redux: Setting edit mode data', action.payload);
      
      const editData = action.payload;
      
      state.editModeData = {
        isEditMode: true,
        leadId: editData.leadId || editData.originalLeadId,
        originalLeadId: editData.originalLeadId || editData.leadId,
        bookingRef: editData.bookingRef,
        modificationCount: editData.modificationCount || 0,
        clientData: editData.clientData || null,
        
        // Preserve all original data
        creationDate: editData.creationDate || editData.clientData?.creationDate,
        bookingTime: editData.bookingTime || editData.clientData?.bookingTime,
        paidAmount: editData.paidAmount || 0,
        totalAmount: editData.totalAmount || 0,
        pendingAmount: editData.pendingAmount || 0,
        
        // Search params
        currentSearchParams: editData.currentSearchParams || null,
        
        // Hotels and planner items
        hotelDetails: editData.hotelDetails || [],
        plannerItems: editData.plannerItems || [],
        
        // Session
        sessionId: editData.sessionId,
        
        timestamp: Date.now()
      };
      
      // Immediately populate current state
      if (editData.sessionId) {
        state.sessionId = editData.sessionId;
      }
      
      if (editData.hotelDetails && editData.hotelDetails.length > 0) {
        console.log('✅ Setting hotels from edit mode:', editData.hotelDetails.length);
        state.hotels = editData.hotelDetails;
      }
      
      if (editData.plannerItems && editData.plannerItems.length > 0) {
        console.log('✅ Setting planner items from edit mode:', editData.plannerItems.length);
        state.plannerItems = editData.plannerItems;
      }
      
      if (editData.currentSearchParams) {
        console.log('✅ Setting search params from edit mode');
        state.currentSearchParams = editData.currentSearchParams;
        
        // Update individual fields
        if (editData.currentSearchParams.country) state.country = editData.currentSearchParams.country;
        if (editData.currentSearchParams.city) state.city = editData.currentSearchParams.city;
        if (editData.currentSearchParams.checkInDate) state.checkInDate = editData.currentSearchParams.checkInDate;
        if (editData.currentSearchParams.checkOutDate) state.checkOutDate = editData.currentSearchParams.checkOutDate;
        if (editData.currentSearchParams.nights) state.nights = editData.currentSearchParams.nights;
        if (editData.currentSearchParams.rooms) state.rooms = editData.currentSearchParams.rooms;
        if (editData.currentSearchParams.packageType) state.packageType = editData.currentSearchParams.packageType;
      }
      
      console.log('✅ Edit mode data fully set in Redux');
    },
    
    // Add to existing reducers
setPlannerItemsWithHotels: (state, action: PayloadAction<PlannerItem[]>) => {
  state.plannerItems = action.payload;
  console.log('Redux: Set planner items with hotels:', action.payload.length);
},

syncFromBackend: (state, action: PayloadAction<{
  hotels: any[];
  plannerItems: any[];
  searchParams: any;
}>) => {
  const { hotels, plannerItems, searchParams } = action.payload;
  
  state.hotels = hotels || [];
  state.plannerItems = plannerItems || [];
  
  if (searchParams) {
    state.currentSearchParams = searchParams;
    state.country = searchParams.country || state.country;
    state.city = searchParams.city || state.city;
    state.checkInDate = searchParams.checkInDate || state.checkInDate;
    state.checkOutDate = searchParams.checkOutDate || state.checkOutDate;
    state.nights = searchParams.nights || state.nights;
    state.rooms = searchParams.rooms || state.rooms;
  }
  
  console.log('Redux: Synced from backend - Hotels:', hotels?.length, 'Items:', plannerItems?.length);
},
  clearEditMode: (state) => {
      state.editMode = {
        isEditMode: false,
        leadId: null,
        leadData: null,
        originalHotels: [],
        originalPlannerItems: [],
        originalSearchParams: null,
        clientData: null
      };
    }
  },
});

export const {
  setSessionId,
  setTripPlannerParams,
  clearTripPlannerParams,
  setHotels,
  addHotel,
  removeHotel,
  // NEW tour actions
  setTours,
  addTour,
  removeTourFromDay,
  updateTourForDay,
  clearSessionData,
  // Enhanced/existing actions
  setPlannerItems,
  updatePlannerItem,
  addTourToPlannerItem,
  removeTour,
  setGrandTotal,
  setSelectedHotel,
  setCurrentSearchParams,
  updateSearchParams,
  resetHotelsAndPlannerItems,
  markSearchAsProcessed,
  setEditModeData,
  clearEditMode,
  setPlannerItemsWithHotels,
  syncFromBackend,
} = tripPlannerSlice.actions;

// Existing selectors
export const selectTripPlannerState = (state: { tripPlanner: TripPlannerState }) => state.tripPlanner;
export const selectHotels = (state: { tripPlanner: TripPlannerState }) => state.tripPlanner.hotels;
export const selectPlannerItems = (state: { tripPlanner: TripPlannerState }) => state.tripPlanner.plannerItems;
export const selectCurrentSearchParams = (state: { tripPlanner: TripPlannerState }) => state.tripPlanner.currentSearchParams;
export const selectGrandTotal = (state: { tripPlanner: TripPlannerState }) => state.tripPlanner.grandTotal;
export const selectSelectedHotel = (state: { tripPlanner: TripPlannerState }) => state.tripPlanner.selectedHotel;
export const selectTours = (state: { tripPlanner: TripPlannerState }) => state.tripPlanner.tours;
export const selectTourByDay = (state: { tripPlanner: TripPlannerState }, specificDayId: string) => state.tripPlanner.tours.find(tour => tour.specificDayId === specificDayId);
export const selectToursByDay = (state: { tripPlanner: TripPlannerState }, specificDayId: string) => state.tripPlanner.tours.filter(tour => tour.specificDayId === specificDayId);
export const selectTourCount = (state: { tripPlanner: TripPlannerState }) => state.tripPlanner.tours.length;
export const selectTourCountByDay = (state: { tripPlanner: TripPlannerState }, specificDayId: string) => state.tripPlanner.tours.filter(tour => tour.specificDayId === specificDayId).length;
export const selectPlannerItemsWithData = (state: { tripPlanner: TripPlannerState }) => {
  return state.tripPlanner.plannerItems.map(item => {
    const tour = state.tripPlanner.tours.find(tour => 
      tour.specificDayId === item.id || tour.specificDayId === item.specificDayId
    );
    
    return {
      ...item,
      tours: tour || item.tours,
      hasHotel: !!item.hotel,
      hasTour: !!(tour || item.tours),
      hasData: !!(item.hotel || tour || item.tours)
    };
  });
};
export const selectEditMode = (state) => state.tripPlanner.editMode;
export const selectIsEditMode = (state) => state.tripPlanner.editMode.isEditMode;
export const selectEditModeData = (state: { tripPlanner: TripPlannerState }) => state.tripPlanner.editModeData;
export const selectIsInEditMode = (state: { tripPlanner: TripPlannerState }) => state.tripPlanner.editModeData?.isEditMode === true;

export default tripPlannerSlice.reducer;

