
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
  export interface HotelOption {
    option?: number;
    totalPackageCost: number;
    perPersonCost: number;
    cnbCost: number;
    cwbCost: number;
    hotels: Hotel[];
  }
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
    id:number;
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
  
  export interface Hotel {
    uniqueId: any;
    specificDayId: string | null;
    hotelSpecificDetails: {};
    nights: number;
    hotel?: HotelDetails;
    image: string;
    hotelName: string;
    city:string;
    star?: number;
    booking?: {
      roomType?: string;
      mealPlan?: string;
      nights?: number;
      totalRooms?: number;
      checkInDate?: string;
      checkOutDate?: string;
      totalAmount:string;
      currency?: string;
      totalPrice?: number;
      price?: number;
    };
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
    mealPlan?: string;
    details?: any;
    roomType?: any;
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
      starRatings?: string | number;
      description?: string;
    
    };
    booking?: {
      roomType?: string;
      mealPlan?: string;
      nights?: number;
      totalRooms?: number;
      checkOutDate?: string;
      checkInDate?: string;
      totalPrice?: number;
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
  
  export interface MealDetails {
    name?: string;
    type?: string;
    amount?: number;
  }
  