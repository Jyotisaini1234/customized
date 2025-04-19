
export interface HotelSummaryParams {
  country: string;
  city: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  rooms: Room[];
  packageType?: string; // Optional for the Customize flow
  filteredHotels?: any[]; // Optional filtered hotels from search
}

export interface Room {
  id: number;
  adults: number;
  cwb: number; // Child with bed
  cnb: number; // Child no bed
  infants: number;
}

// Props for HotelSearch component
export interface HotelSearchProps {
  isModifying?: boolean;
  initialValues?: Partial<HotelSummaryParams>;
  onSearchComplete?: (params: HotelSummaryParams) => void;
}

// Props for Customize component
export interface CustomizeSearchProps {
  isModifying?: boolean;
  initialValues?: Partial<HotelSummaryParams>;
  onSearchComplete?: (params: HotelSummaryParams) => void;
}

// Props for TripPlanner component
export interface TripPlannerProps {
  location: string;
  nights: number;
  checkInDate: string;
  checkOutDate: string;
  rooms?: Room[];
  country?: string;
  packageType?: string;
  filteredHotels?: any[];
  onCancel: () => void;
  onProceed: (params: HotelSummaryParams) => void;
}

  
export interface PlannerItem {
  dateObj: any;
  id: string;
  date: string;
  fullDate?: Date;
  hotel: {
    name: string;
    details: any;
  } | null;
  transfer: any | null;
  tours: any | null;
  meals: any | null;
}

export interface RoomState {
    id: number;
    adults: number;
    cwb: number;
    cnb: number;
    infants: number;
}


export interface AreaOption {
  value: string;
  label: string;
}
export interface Area {
  value: string;
  label: string;
}

export const Areas: Area[] = [
{ value: 'Baku', label: 'Baku'},
{ value: 'Gabala', label: 'Gabala'},
{ value: 'Shahdag', label: 'Shahdag'},
{ value: 'Sheki', label: 'Sheki'},
{ value: 'Shamakhi', label: 'Shamakhi'},
];


export interface Hotel {
  mealPlan: string | undefined;
  details: any;
  roomType: any;
  hotel?: {
    hotelName: string;
  };
  booking?: {
    roomType: string;
    mealPlan: string;
    totalRooms: number;
  };
}
export interface Tour {
  duration?: string;
  description?: string;
  details?: {
    tour?: {
      description?: string;
    };
  };
}


export interface TourItem {
  name: string;
  details?: {
    tour?: Tour;
  };
}

export interface MealItem {
  name: string;
  details?: string;
}

export interface TransferItem {
  name: string;
  details?: string;
}

export interface PackageCosts {
  finalAmount: number;
  packageDetails?: {
    totalPersons: number;
  };
}

export interface SearchParams {
  checkInDate?: string;
  checkOutDate?: string;
  nights?: number;
  rooms?: Array<{
    adults: number;
  }>;
}

export interface TripPlannerData {
  bookingRef: string;
  generateDate: string;
  currentSearchParams: SearchParams;
  hotels: Hotel[];
  plannerItems: PlannerItem[];
  costs: PackageCosts;
  currency: string;
}

