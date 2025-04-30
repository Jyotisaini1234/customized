import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASE_URL } from '../utils/ApiConstants.ts';

export const tourApi = createApi({
  reducerPath: 'tourApi',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    getHotelsByCity: builder.query<any, { city: string; country: string }>({
      query: ({ city, country }) =>
        `sightTour/hotelbyCity?city=${city}&country=${country}`,
    }),

    submitLead: builder.mutation<any, any>({
      query: (leadData) => ({
        url: '/sightTour',
        method: 'POST',
        body: leadData,
      }),
    }),
    getLeads: builder.query<any[], void>({
      query: () => '/sightTour/leads', // Assuming your backend has a GET /leads endpoint
    }),
    
  }),
});

export const {
  useGetHotelsByCityQuery,
  useSubmitLeadMutation,
  useGetLeadsQuery
} = tourApi;
