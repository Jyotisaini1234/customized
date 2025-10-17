import {  Room, Hotel, HotelDetails, HotelData, HotelDetail, HotelOption } from "./hotel.types";
import {  PackageDetails } from "./package.types";
import {   TourDetails } from "./tour.types";

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

  export interface Itinerary {
    price: number;
    day: number;
    date: string;
    title: string;
    details: string;
  }
  
export interface PlannerItem {
  itinerary: any;
  hotels: boolean;
  dayNumber: string;
  eventDate: string;
  dateObj: any;
  id: string;
  date: Date;
  fullDate?: Date;
  hotel?: {
    price(price: any): unknown;
    id: any;
    destination: any;
    nights: number;
    rating: number;
    checkInDate: any;
    checkOutDate: string;
    roomType: any;
    mealPlan: any;
    isAdditional: boolean;
    specificDayId: any;
    uniqueId: any;
    booking: any;
    rooms: number;
    hotelName: string;
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




export interface PackageCosts {
  finalAmount: number;
  packageDetails?: {
    totalPersons: number;
  };
}

export interface SearchParams {
  isTemporaryHotelSearch: boolean;
  specificDayId: any;
  city: any;
  country:any;
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
  originalBookingData: any;
  isTourTransfer: any;
  isBooking: any;
  id?: string;
  bookingRef?: string;
  referenceId?: string;
  clientName: string;
  email?: string;
  phone?: string;
  from?: string;
  conversion?: string;
  options: string;
  createdByEmail:string | null;
  type: string;
  travelDate: string;
  totalAmount: number;
  bookingStatus: string;
  destinations?: string;
  creationDate: string;
  bookingTime: string;
  status: string;
  nights: number;
  lastUpdated: string;
  currency: string;
  totalRooms:string | number;
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
export interface Costs {
  finalAmount: number;
  packageDetails?: PackageDetails;
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


export interface LeadInvoiceData {
  destinations: any;
  isTourTransfer: any;
  packageType: string;
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
  bookingItems:BookingItem[];
  destination:string;
  country:string;
}

export interface LeadDetail {
  country: any;
  isBooking: boolean;
  options: string;
  isTourTransfer: boolean;
  bookingItems: never[];
  packageType: string;
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


// export interface Hotel2{
//   name: string;
//   destination: string;
//   nights: number;
//   star?: number;
//   img:string;
//   stayDates: string[];
//   mealPlan: string;
//   roomType: string;
// }




// export interface PackageData {
//   isModifying?: boolean;
//   id: string;
//   packageDetails: PackageDetails;
// }


// export interface Room {
//   adults: number;
//   cwb: number;
//   cnb: number;
//   infants: number;
// }

export interface Country {
  label: string;
  id: number;
}

export interface City {
  label: string;
  id: number;
  countryId: number;
}

export interface TripPlannerParams {
  city?: string;
  country?: string;
  selectedCountry?: string;
  selectedCity?: string;
  applyToAllDays?: boolean;
  nights?: number;
  rooms?: Array<{
    adults: number;
    cwb: number;
    cnb: number;
    infants: number;
  }>;
  checkInDate?: string;
  checkOutDate?: string;
  originalCheckOutDate?: string;
  fromReadymadePackage?: boolean | string;
  specificDay?: boolean;
  specificDayId?: string;
  dayNumber?: string;
  allDays?: any;
  leadId?: string;
}
