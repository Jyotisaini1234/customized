
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
  eventDate: string;
  dateObj: any;
  id: string;
  date: string;
  fullDate?: Date;
  hotel: {
    name: string;
    details: any;
    hotelSpecificDetails: any;
  } | null;
  transfer: any | null;
  tours: any | null;
  meals: any | null;
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
  hotel?: HotelDetails;
  city:string;
  booking?: {
    roomType?: string;
    mealPlan?: string;
    nights?: number;
    totalRooms?: number;
    checkInDate?: string;
    checkOutDate?: string;
    totalAmount:string;
  };
  room?: {
    roomCategory?: string;
    mealPlan?: string;
  };
  mealPlan?: string;
  details?: any;
  roomType?: any;
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
  city: any;
  checkInDate?: string;
  checkOutDate?: string;
  nights?: number;
  rooms?: Room[]
  
}
export interface ClientDetails {
  name?: string;
  email?: string;
  phone?: string;
  from?: string;
  conversion?: string;
  options?: string;
}

export interface TripPlannerData {
  bookingRef?: string;
  generateDate?: string;
  country?:string;
  clientDetails?: ClientDetails;
  currentSearchParams?: SearchParams;
  hotels?: Hotel[];
  plannerItems?: PlannerItem[];

  costs?: {
    finalAmount?: number;
    packageDetails?: {
      totalPersons?: number;
    };
  };
  currency?: string;
  
}

export interface ClientDetailsFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (clientData: any) => void;
  bookingRef: string;
  destinations:string;
  nights:string;
  hotelName:string;
  travelDate:string;
  grandTotal:number;
  marginTotal:string;
  currency:number;
  currentSearchParams:string;
  hotels:string;
  plannerItems:string;
  hotelDetails:HotelDetails[];
  tourActivities:TourDetails[];
  activities:Activity[];
  persons:string;
  isEditMode?: boolean;
  initialClientData?: any;
  originalLeadId?: string;
  selectedHotels?: Hotel[];
  selectedPlannerItems?: PlannerItem[];
  
}

export interface Quote {
  id: string;
  label: string;
  price: number;
}

export interface Lead {
  id?: string;
  bookingRef?: string;
  referenceId?: string;
  clientName: string;
  email?: string;
  phone?: string;
  from?: string;
  conversion?: string;
  options: string;
  type: string;
  travelDate: string;
  totalAmount: number;
  bookingStatus: string;
  destination?: string;
  destinations?: string;
  creationDate: string;
  bookingTime: string;
  status: string;
  nights: number;
  lastUpdated: string;
  currency: string;
  hotelDetails?: any[];
  plannerItems?: any[];
  pendingAmount?: number;
  paidAmount?: number;
  currentSearchParams?: {
    city: string;
  };
  clientDetails?: {
    destinations?: string;
  };

}

export interface HotelDetails {
  starRating?: string | number;
  city?: string;
  name?: string;
  hotelName?: string;
  area?: string;
  description?:string;
  hotel?: {
    starRating?: string | number;
    city?: string;
    name?: string;
    hotelName?: string;
    area?: string;
    starRatings?: string | number; // ✅ add this if needed
    description?: string;
  
  };
  booking?: {
    roomType?: string;
    mealPlan?: string;
    nights?: number;
    totalRooms?: number;
    checkOutDate?: string; // ✅ add this
    checkInDate?: string;  // ✅ optionally add this
    totalPrice?: number;   // ✅ add this
  };
  room?: {
    roomCategory?: string;
    mealPlan?: string;
  };
  details?: {
    starRating?: string | number;
    city?: string;
    hotel?: {
      starRating?: string | number;
      city?: string;
      name?: string;
      hotelName?: string;
      area?: string;
    };
    booking?: {
      roomType?: string;
      mealPlan?: string;
      nights?: number;
    };
    room?: {
      roomCategory?: string;
      mealPlan?: string;
    };
  };
  hotelSpecificDetails?: {
    starRating?: string | number;
    city?: string;
  };
  nights?: number;
}
export interface Activity {
  date: string;
  duration: string;
  description: string;
  name: string;
  price?: number;
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

export interface MealDetails {
  name?: string;
  type?: string;
  amount?: number;
}


export interface HotelBooking {
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  roomType: string;
  mealPlan: string;
  totalPrice: number;
  currency?: string;
  starRating?: string;

}


export interface Room {
  roomCategory: string;
  mealPlan: string;
}

export interface HotelDetail {
  totalRooms: string;
  hotelName: string;
  roomType: string;
  mealPlan: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalPrice: number;
  currency?: string;
  starRating?: string;
  city:string;
}

export interface HotelData {
  hotel?: Hotel;
  booking?: HotelBooking;
  room?: Room;
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


export interface PackageDetails {
  totalPersons: number;
}

export interface Costs {
  finalAmount: number;
  packageDetails?: PackageDetails;
}



export interface LeadInvoiceData {
  bookingRef: string;
  generateDate: string;
  clientDetails: ClientDetails;
  currentSearchParams?: SearchParams;
  hotels?: HotelData[];
  hotelDetails?: HotelDetail[]; 
  plannerItems: PlannerItem[];
  costs: Costs;
  currency: string;
  totalPersons?: string | number;
}

export interface LeadDetail {
  id?: string;
  _id?: string;
  referenceId: string;
  bookingNo?: string;
  clientName: string;
  email?: string;
  clientDetails?: {
    name: string;
    email: string;
    phone: string;
    from: string;
    type: string;
    destinations?: string;
  };
  currentSearchParams?: SearchParams;
  hotels?: HotelData[];
  hotelDetails?: HotelDetail[];
  plannerItems?: PlannerItem[];
  costs?: Costs;
  currency?: string;
  type: string;
  phone: string;
  creationDate: string;
  travelDate: string;
  from: string;
  destinations?: string;
  totalAmount: number;
  pendingAmount?: number;
  status: string;
  totalPersons?: string | number;
  nights?: string | number;
}


  export interface OptionType {
    label: string;
    id: number;
    countryId?: number;
  }

