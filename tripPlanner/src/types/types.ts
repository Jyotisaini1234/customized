
export interface HotelSummaryParams {
  country: string;
  city: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  rooms: Room[];
  packageType?: string;
  filteredHotels?: any[];
  packageData?: any;
}

export interface Room {
  id: number;
  adults: number;
  cwb: number;
  cnb: number;
  infants: number;
}

export interface HotelSearchProps {
  isModifying?: boolean;
  initialValues?: Partial<HotelSummaryParams>;
  onSearchComplete?: (params: HotelSummaryParams) => void;
}

export interface CustomizeSearchProps {
  isModifying?: boolean;
  initialValues?: Partial<HotelSummaryParams>;
  onSearchComplete?: (params: HotelSummaryParams) => void;
}

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
  dayNumber: string;
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
export interface TourItem {
  name: string;
  details?: {
    tour?: Tour;
  };
  price?: number;
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
  nights: number;
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
  source?: string;
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
  img: string;
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

export interface Hotel {
  star: number;
  image: string;
  hotelName: string;
  rooms: Array<{
    roomType: string;
    prices: {
      adult: number;
      cwb: number;
      cnb: number;
    };
    availability: boolean;
    maxOccupancy: number;
  }>;
}

export interface Hotel2{
  name: string;
  destination: string;
  nights: number;
  star?: number;
  stayDates: string[];
  mealPlan: string;
  roomType: string;
}

export interface HotelOption {
  option?: number;
  totalPackageCost: number;
  perPersonCost: number;
  cnbCost: number;
  cwbCost: number;
  hotels: Hotel2[];
}

export interface Validity {
  startDate: string;
  endDate: string;
}

export interface TravelDates {
  start: string;
  end: string;
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

export interface Itinerary {
  price: number;
  day: number;
  date: string;
  title: string;
  details: string;
}

export interface CancellationPolicy {
  before30Days: string;
  before21Days: string;
  before15Days: string;
  nonRefundablePeriods: string;
  notes: string;
}

export interface PackageDetails {
  packageName: string;
  validity: Validity;
  quotationDate: string;
  destination?: string;
  destinations?: string[];
  travelDates: TravelDates;
  passengers: Passengers;
  hotelOptions?: HotelOption[];
  hotelOption: HotelOption[];
  activities: Activity[];
  transfers: Transfer[];
  inclusions: string[];
  exclusions: string[];
  itinerary: Itinerary[];
  cancellationPolicy: CancellationPolicy;
  importantNotes: string[];
}

export interface PackageData {
  isModifying?: boolean;
  id: string;
  packageDetails: PackageDetails;
}

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface TabPanelPropsLocal {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface PackagePDFGeneratorProps {
  packageData?: PackageData;
  selectedHotelOption?: {
    hotels: Array<{
      name: string;
      destination: string;
      roomType: string;
      nights: number;
      mealPlan?: string;
      stayDates?: string[];
    }>;
    perPersonCost: number;
    totalPackageCost: number;
  };
  selectedOptionIndex?: number;
  selectedSeason?: string;
  customerName?: string;
  companyDetails?: {
    name: string;
    subtitle: string;
    title: string;
  };
}

export interface ItineraryItem {
  day: number;
  title: string;
  details: string;
  description: string;
  date?: string;
}
export interface ReadymadeSearchProps {
  isModifying?: boolean;
  initialValues?: Partial<HotelSummaryParams>;
  onSearchComplete?: (params: HotelSummaryParams) => void;
  packageId?: string | null;
}

export interface ReadymadeData {
  packageData: any;
  packageId: string;
  selectedHotelOption: string;
  selectedSeason: string;
}


export interface ReadyMadeHotel {
  specificDayId: any;
  checkOutDate: any;
  checkInDate: any;
  id: string;
  name: string;
  destination: string;
  nights: number;
  price: number;
  image?: string;
  rating?: number;
  uniqueId:number
  roomType?: string;
  mealPlan?: string;
  isPackageHotel?: boolean;
  isAdditional?: boolean;
  isUpdated?: boolean;
  isDeleted?: boolean;
  isAssigned?: boolean;
  source?: string;
}

export interface Transfer {
  id: string;
  from: string;
  to: string;
  type: string;
  price?: number;
  vehicleType?: string;
  isPackageTransfer?: boolean;
  isDeleted?: boolean;
  isAssigned?: boolean;
  source?: string;
}

export interface PackageItinerary {
  isPackageItinerary: boolean;
  isUpdated: boolean;
  activities: any[];
  description: string;
  day: number;
  date: string;
  title: string;
  source:String;
  price: number;
  dayId:string ;
  isAssigned:boolean;
  details: string;
}

export interface TourData {
    tourDetails?: {
      id?: string;
      tourName?: string;
      sightName?: string;
      name?: string;
      description?: string;
      eventDuration?: string;
      city?: string;
      currency?: string;
      price?: number;
      tour?: {
        tourName?: string;
      };
    };
    tour?: TourData['tourDetails']; // Same structure as tourDetails
    booking?: {
      totalPrice?: number;
      date?: string;
      city?: string;
      currency?: string;
    };
    specificDayId?: string;
}



export interface PackageItinerary {
   id: string;
    day: number;
    date: string;
    title: string;
    price: number;
    details: string;
}

export interface PackageHotel {
    name: string;
    destination: string;
    star: number;
    nights: number;
    price: number;
    currency: string;
    mealPlan: string;
    roomType: string;
}

export interface PackageData {
    packageName: string;
    hotelOption: Array<{
        hotels: PackageHotel[];
        cnbCost:number;
        cwbCost:number
        perPersonCost: number;
        totalPackageCost: number;
    }>;
    activities: Array<{
        name: string;
        type: string;
        vehicle?: string;
        ticketIncluded: boolean;
        price?: number;
    }>;
    transfers: Array<{
        route: string;
        vehicle: string;
        type: string;
        price?: number;
    }>;
    itinerary: PackageItinerary[];
}

export interface SearchData {
  pricing?: {
    totalPrice: number;
    breakdown: {
      adults: {
        count: number;
        pricePerPerson: number;
        totalPrice: number;
      };
      cwb: {
        count: number;
        pricePerPerson: number;
        totalPrice: number;
      };
      cnb: {
        count: number;
        pricePerPerson: number;
        totalPrice: number;
      };
      infants: {
        count: number;
        pricePerPerson: number;
        totalPrice: number;
      };
      rooms:{
        count:string;
        multiplier:string;
      }
    };
  };
    totalRooms: number;
    packageData?: {
        packageDetails: PackageData;
    };
    checkInDate?: string;
    checkOutDate?: string;
    nights?: number;
    totalNights?: number;
    destinations?: string[];
    guests?: {
        adults: number;
        cwb: number;
        cnb: number;
        infants: number;
    };
    room?: Array<{
        adults: number;
        cwb: number;
        cnb: number;
        infants: number;
    }>;
}

export interface PlannerItem2 {
    dateObj: string | number | Date;
    id: string;
    date: Date;
    hotel?: any;
    tours?: any;
    transfer?: any;
    itinerary?: PackageItinerary;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
  message?: string;
  refreshed?: boolean;
}

export interface Room {
  adults: number;
  cwb: number;
  cnb: number;
  infants: number;
}

export interface TripPlannerDBData {
  tripId?: string;
  userId?: string;
  tripDetails: {
    destination: string;
    country: string;
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    totalDays: number;
    adults: number;
    children: number;
    infants: number;
    rooms: any[];
    packageType: string;
    currency: string;
  };
  
  pricing: {
    grandTotal: number;
    marginTotal: string;
    breakdown: {
      hotelsCost: number;
      activitiesCost: number;
      transfersCost: number;
      itineraryCost: number;
    };
  };
  
  plannerItems: {
    dayId: string;
    date: string;
    dayNumber: number;
    hotel?: {
      id: string;
      name: string;
      destination: string;
      nights: number;
      price: number;
      rating: number;
      checkInDate?: string;
      checkOutDate?: string;
      roomType?: string;
      mealPlan?: string;
      isPackageHotel: boolean;
      isAdditional: boolean;
      isUpdated: boolean;
      uniqueId?: number;
      specificDayId?: string;
      source: string;
    };
    tours?: {
      id: string;
      name: string;
      price: number;
      description: string;
      duration: string;
      city: string;
      assignedDayId: string;
      isAdditional: boolean;
      isUpdated: boolean;
      currency: string;
      type: string;
      source: string;
    };
    transfer?: {
      id: string;
      name: string;
      route: string;
      price: number;
      from: string;
      to: string;
      vehicleType?: string;
      type: string;
      isPackageTransfer: boolean;
      source: string;
    };
    itinerary?: {
      id: string;
      title: string;
      description: string;
      details: string;
      price: number;
      activities: any[];
      isUpdated: boolean;
      isPackageItinerary: boolean;
      day: number;
      source: string;
    };
  }[];

  packageData?: {
    packageName: string;
    originalPackageData: any;
  };
  
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}
