import { HotelOption, HotelSummaryParams } from "./hotel.types";
import { Passengers, Activity } from "./tour.types";


export interface PackageDetails {
  img: string;
  totalPersons: number;
}

export interface Costs {
  finalAmount: number;
  packageDetails?: PackageDetails;
}

export interface Validity {
    startDate: string;
    endDate: string;
  }
   
  export interface Itinerary {
    price: number;
    day: number;
    date: string;
    title: string;
    details: string;
  }
  
  export interface TravelDates {
    start: string;
    end: string;
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
export interface PackageHotel {
    id: any;
    name: string;
    destination: string;
    star: number;
    nights: number;
    price: number;
    img?: string;
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
  cityId: string;
  city: string;
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
}

export interface PackageItinerary {
  id: string;
  isPackageItinerary: boolean;
  isUpdated: boolean;
  activities: any[];
  description: string;
  day: number;
  date: string;
  title: string;
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
    tour?: TourData['tourDetails'];
    booking?: {
      totalPrice?: number;
      date?: string;
      city?: string;
      currency?: string;
    };
    specificDayId?: string;
}


export interface SearchData {
    sessionId: string;
    selectedCountry: string;
    city: any;
    cityId: any;
    country:string;
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

export interface TripPlannerDBData {
  tripId?: string;
  userId?: string;
  
  tripDetails: {
    destination: string;
    country: string;
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    rooms: any[];
    cityId:string;
    createdByEmail:string;
    totalRooms:string;
    
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
      isAdditional: boolean;

      specificDayId?: string;
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
      checkInDate:string
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
    };
  }[];
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface BookingData {
  bookingItems: never[];
  totalPrice: number;
  grandTotal: any;
  currency: string;
  email: string;
  name: string;
  packageType: string;
  bookingReference: any;
  bookingNumber: string;
  referenceNumber: string;
  bookingDate: string;
  confirmedBy: string;
  destination: string;
  hotelName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  cancelDate?: string;
  cancelledBy?: string;
  status: string;
  details?: {
    adults: number;
    extraAdults: number;
    childWithBed: number;
    childWithoutBed: number;
    infants: number;
    amount: string;
    hotel: string;
    category: string;
    area: string;
    nights: number;
    rooms: number;
    roomType: string;
    freebies?: string[];
    cancellationPolicy?: string;
    costExcludes?: string[];
  };
}
export interface BookingItem {
  id: number;
  sightName: string;
  description?:string;
  date: string;
  type: string;
  pickUp: string;
  pax: number;
  cost: number;
  currency: string;
  commuteType: string;
  selectedActivities: Record<string, boolean>;
}
export interface TourBookingData {
  bookingData: any;
  referenceId: string;
  bookingNo: any;
  bookingRef: any;
  country: any;
  destinations: any;
  destination: any;
  city: any;
  travelDate: any;
  checkInDate: any;
  hotelDetails: any;
  checkOutDate: any;
  nights(nights: any): number | undefined;
  totalNights(totalNights: any): number | undefined;
  totalPersons: any;
  adults: any;
  plannerItems: any;
  totalAmount: number;
  finalAmount: any;
  amount: any;
  id?: string;
  bookingReference: string;
  bookingDate: string;
  packageType: string;
  bookingItems: BookingItem[];
  totalPrice: number;
  grandTotal: number;
  currency: string;
  status: string;
  name: string;
  email: string;
}

export interface BookingTours {
  id?: string;
  bookingData: TourBookingData;
}
