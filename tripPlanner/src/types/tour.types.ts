import { Hotel, HotelSummaryParams } from "./hotel.types";
import { ClientDetails, SearchParams } from "./types";

export interface TripPlannerProps {
  initialClientData?: any;
  location: string;
  city: string;
  nights: number;
  checkInDate: string;
  checkOutDate: string;
  rooms: {
    id: number;
    adults: number;
    cwb: number;
    cnb: number;
    infants: number;
  }[];
  country?: string;
  packageType?: string;
  filteredHotels?: any[];
  onCancel: () => void;
  onProceed: (params: HotelSummaryParams) => void;
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

export interface TourItem {
    name: string;
    details?: {
      tour?: Tour;
    };
    price?: number;
  }

export interface ItineraryItem {
    day: number;
    title: string;
    details: string;
    description: string;
    date?: string;
  }
  export interface TripPlannerData {
    bookingRef?: string;
    generateDate?: string;
    country?:string;
    clientDetails?: ClientDetails;
    currentSearchParams?: SearchParams;
    hotels?: Hotel[];
    plannerItems?: PlannerItem[];
    totalRooms:any[];
    costs?: {
      finalAmount?: number;
      packageDetails?: {
        totalPersons?: number;
      };
    };
    currency?: string;
    
  }


  export interface TourDetails {
    tourName: string | undefined;
    eventDate: any;
    booking: any;
    duration: string | undefined;
    price: number;
    name?: string;
    description?: string;
    details?: {
      tour?: {
        tourName?: string;
        description?: string;
        duration?: string;
      };
      booking?: {
        selectedActivities?: Record<string, boolean>;
        activityDetails?: Activity[];
        activityPrices?: Record<string, number>;
      };
    };
    eventDuration?: string;
    currency?: string;
    activities?: Activity[];
  }
  
  
  export interface TransferDetails {
    name?: string;
    type?: string;
    amount?: number;
  }
  
  
  
  export interface TourActivity {
    name: string;
    description: string;
    price: number;
    details?: {
      tour?: {
        duration: string;
      }
    };
    eventDuration?: string;
    activities?: Array<{price: number, name?: string}>;
    duration?: string;
    currency?: string;
  }
  

  
  export interface Activity {
    vehicle: string;
    type: string;
    city:string;
    id: string;
    date: string;
    duration: string;
    description: string;
    name: string;
    price?: number;
    currency?: string;
    location?: string;
    assignedDayId?: string;
    isAdditional?: boolean;
    isUpdated?: boolean;
    isDeleted?: boolean;
    isAssigned?: boolean;
  }


  export interface Passengers {
    adult: number;
    child: number;
    infant: number;
  }
  
  export interface Transfer {
    name: any;
    route: string;
    vehicle: string;
    type: string;
  }

export interface TourData {
    name: string;
    description: string;
    duration: string | number;
    currency: string;
    price: number;
    city: string;
    eventDuration: string | number;
    activities: {
      name: string;
      price: number;
      currency: string;
    }[];
    carType: {
      carType: string;
      price: number;
    }[];
    details: {
      tour: {
        tourName: string;
        description: string;
        duration: string | number;
      };
      booking: {
        selectedActivities: any;
        activityDetails: {
          name: string;
          price: number;
          currency: string;
        }[];
      };
    };
  }
 export interface PlannerItem {
    meals: any;
    id: string;
    date: Date;
    dateObj: string;
    hotel?: any;
    tours?: any;
    transfer?: any;
    itinerary?: any;
  }