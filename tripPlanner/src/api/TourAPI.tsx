import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {  BASE_URL, HOTEL_FETCH } from '../utils/ApiConstants.ts';



export const tourApi = createApi({
  reducerPath: 'tourApi',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
getHotelsByCity: builder.query<any, { city: string; country: string }>({
  query: ({ city, country }) => `sightTour/hotelbyCity?city=${city}&country=${country}`,
}),


  }),
});

export const { 

  useGetHotelsByCityQuery,
} = tourApi;