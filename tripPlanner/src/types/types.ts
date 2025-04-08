// In types.ts

// Common interface for hotel summary parameters
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
