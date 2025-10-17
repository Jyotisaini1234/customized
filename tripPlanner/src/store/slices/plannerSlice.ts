import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface HotelDisplayInfo {
  isFirstDay: boolean;
  isLastDay: boolean;
  dayNumber: number;
  totalDays: number;
}

interface Hotel {
  id: string;
  name: string;
  destination: string;
  city: string;
  nights: number;
  price: number;
  rating: number;
  checkInDate: string;
  checkOutDate: string;
  specificDayId?: string;
  uniqueId: string;
  isAdditional: boolean;
  roomType?: string;
  mealPlan?: string;
  img?: string;
  rooms?: number;
  displayInfo?: HotelDisplayInfo;
}

interface Tour {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration?: string;
  city?: string;
  assignedDayId?: string;
}

interface PlannerItem {
  id: string;
  date: Date;
  dateObj: string;
  hotel?: Hotel;
  tours?: Tour | Tour[];
  transfer?: any;
  itinerary?: any;
}

interface PlannerState {
  plannerItems: PlannerItem[];
  hotels: Hotel[];
  activities: Tour[];
  transfers: any[];
  grandTotal: number;
  sessionId: string | null;
  searchParams: any;
}

const initialState: PlannerState = {
  plannerItems: [],
  hotels: [],
  activities: [],
  transfers: [],
  grandTotal: 0,
  sessionId: null,
  searchParams: null,
};

export const selectPlanner = (state: any) => state.planner || initialState;

const plannerSlice = createSlice({
  name: 'planner',
  initialState,
  reducers: {
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    
    setSearchParams: (state, action: PayloadAction<any>) => {
      state.searchParams = action.payload;
    },
    
    setPlannerItems: (state, action: PayloadAction<PlannerItem[]>) => {
      state.plannerItems = action.payload;
    },
    
    setHotels: (state, action: PayloadAction<Hotel[]>) => {
      const newHotels = action.payload;
      const existingHotelsMap = new Map(state.hotels.map(h => [h.uniqueId, h]));
      newHotels.forEach(newHotel => {existingHotelsMap.set(newHotel.uniqueId, newHotel); });
      state.hotels = Array.from(existingHotelsMap.values());
    },
    
    addHotel: (state, action: PayloadAction<Hotel>) => {
      const hotel = action.payload;
      const existingIndex = state.hotels.findIndex(h => h.uniqueId === hotel.uniqueId);
      if (existingIndex >= 0) {
        state.hotels[existingIndex] = hotel;
      } else {state.hotels.push(hotel);}
      const dayIndex = state.plannerItems.findIndex(item => item.id === hotel.specificDayId);
      if (dayIndex >= 0) {
        const nights = hotel.nights || 1;
        const startDayIndex = dayIndex;
        const endDayIndex = Math.min(dayIndex + nights - 1, state.plannerItems.length - 1);
        for (let i = startDayIndex; i <= endDayIndex; i++) {
          state.plannerItems[i].hotel = {
            ...hotel,
            displayInfo: {
              isFirstDay: i === startDayIndex,
              isLastDay: i === endDayIndex,
              dayNumber: i - startDayIndex + 1,
              totalDays: endDayIndex - startDayIndex + 1,
            },
          };
        }
      }
    },
    
    removeHotel: (state, action: PayloadAction<string>) => {
      const uniqueId = action.payload;
      const removedHotel = state.hotels.find(h => h.uniqueId === uniqueId);
      state.hotels = state.hotels.filter(h => h.uniqueId !== uniqueId);
      if (removedHotel) {
        console.log('Removed hotel:', removedHotel.name);
      }
      state.plannerItems = state.plannerItems.map(item => {
        if (item.hotel?.uniqueId === uniqueId) {
          return { ...item, hotel: undefined };
        }
        return item;
      });
    },
    
    setActivities: (state, action: PayloadAction<Tour[]>) => {
      state.activities = action.payload;
    },
    
    addActivity: (state, action: PayloadAction<Tour>) => {
      const activity = action.payload;
      const existingIndex = state.activities.findIndex(a => a.id === activity.id);
      if (existingIndex >= 0) {
        state.activities[existingIndex] = activity;
      } else { state.activities.push(activity);}
      if (activity.assignedDayId) {
        const itemIndex = state.plannerItems.findIndex(item => item.id === activity.assignedDayId);
        if (itemIndex >= 0) {
          state.plannerItems[itemIndex].tours = activity;
        }
      }
    },
    
    removeActivity: (state, action: PayloadAction<string>) => {
        const activityId = action.payload;
        state.activities = state.activities.filter((a: any) => {
          return a.uniqueId !== activityId && a.id !== activityId;
        });
        state.plannerItems = state.plannerItems.map((item: any) => {
          if (item.tours) {
            if (!Array.isArray(item.tours) && ((item.tours as any).uniqueId === activityId || (item.tours as any).id === activityId)) {
              return { ...item, tours: undefined };
            }
            if (Array.isArray(item.tours)) {
              const filteredTours = item.tours.filter((tour: any) => tour.uniqueId !== activityId && tour.id !== activityId);
              return {...item,  tours: filteredTours.length > 0 ? filteredTours : undefined  };
            }
          }
          return item;
        });
      },
    
    removeTour: (state, action: PayloadAction<{ specificDayId: string; tourUniqueId: string }>) => {
        const { specificDayId, tourUniqueId } = action.payload;
        const itemIndex = state.plannerItems.findIndex(item => item.id === specificDayId);
        if (itemIndex >= 0) {
          const item = state.plannerItems[itemIndex];
          if (Array.isArray(item.tours)) {
            const filteredTours = item.tours.filter((tour: any) => tour.uniqueId !== tourUniqueId);
            state.plannerItems[itemIndex].tours = filteredTours.length > 0 ? filteredTours : undefined;
          }
          else if (item.tours && (item.tours as any).uniqueId === tourUniqueId) {
            state.plannerItems[itemIndex] = { ...state.plannerItems[itemIndex],tours: undefined};
          }
        }
        state.activities = state.activities.filter(
          (activity: any) => activity.uniqueId !== tourUniqueId
        );
    },
    
    setGrandTotal: (state, action: PayloadAction<number>) => {
      state.grandTotal = action.payload;
    },
    loadBackendData: (state, action: PayloadAction<{hotels: Hotel[];plannerItems: PlannerItem[];searchParams: any;sessionId: string; }>) => {
      const { hotels, plannerItems, searchParams, sessionId } = action.payload;
      state.sessionId = sessionId;
      state.searchParams = searchParams;
      const existingHotelsMap = new Map(state.hotels.map(h => [h.uniqueId, h]));
      hotels.forEach(hotel => {existingHotelsMap.set(hotel.uniqueId, hotel);});
      state.hotels = Array.from(existingHotelsMap.values());
      state.hotels.forEach(hotel => {
        if (hotel.specificDayId) {
          const dayIndex = state.plannerItems.findIndex(item => item.id === hotel.specificDayId);
          if (dayIndex >= 0) {
            const nights = hotel.nights || 1;
            const startDayIndex = dayIndex;
            const endDayIndex = Math.min(dayIndex + nights - 1, state.plannerItems.length - 1);
            for (let i = startDayIndex; i <= endDayIndex; i++) {
              state.plannerItems[i].hotel = {
                ...hotel,
                displayInfo: {
                  isFirstDay: i === startDayIndex,
                  isLastDay: i === endDayIndex,
                  dayNumber: i - startDayIndex + 1,
                  totalDays: endDayIndex - startDayIndex + 1,
                },
              };
            }
          }
        }
      });
    },
    
    clearPlannerData: (state) => {
      state.plannerItems = [];
      state.hotels = [];
      state.activities = [];
      state.transfers = [];
      state.grandTotal = 0;
    },
  },
});

export const {
  setSessionId,
  setSearchParams,
  setPlannerItems,
  setHotels,
  addHotel,
  removeHotel,
  setActivities,
  addActivity,
  removeActivity,
  removeTour,
  setGrandTotal,
  loadBackendData,
  clearPlannerData,
} = plannerSlice.actions;

export default plannerSlice.reducer;