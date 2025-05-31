import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASE_URL } from '../utils/ApiConstants.ts';
import { Lead } from '../types/types.ts';

export const tourApi = createApi({
  reducerPath: 'tourApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      headers.set('Access-Control-Allow-Origin', '*');
      return headers;
    },
  }),
  tagTypes: ['Bookings', 'Lead'],
  endpoints: (builder) => ({
    getHotelsByCity: builder.query<any, { city: string; country: string }>({
      query: ({ city, country }) =>
        `sightTour/hotelbyCity?city=${city}&country=${country}`,
    }),

    submitLead: builder.mutation<any, any>({
      query: (leadData) => ({
        url: '/sightTour/lead',
        method: 'POST',
        body: leadData,
      }),
      invalidatesTags: ['Lead'],
    }),

    getLeads: builder.query<any[], void>({
      query: () => '/sightTour/leads',
      providesTags: ['Lead'],
    }),

    updateLead: builder.mutation<Lead, { id: string; lead: Partial<Lead> }>({
      query: ({ id, lead }) => {
        console.log('API: Updating lead:', id, lead);
        console.log('API: Full URL will be:', `${BASE_URL}/sightTour/lead/${id}`);
        return {
          url: `/sightTour/lead/${id}`,
          method: 'PUT',
          body: lead,
        };
      },
      transformErrorResponse: (response, meta, arg) => {
        console.error(' API Error:', response);
        console.error(' API Meta:', meta);
        console.error(' API Args:', arg);
        return response;
      },
      invalidatesTags: ['Lead'],
    }),
  
  
    getLeadById: builder.query<any, string>({
      query: (id) => {
        console.log('Fetching Lead Data:', id);
        return `/sightTour/lead/${id}`;
      },
    }),
    
    deleteLead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/sightTour/lead/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lead'],
    }),
  }),
});

export const {
  useGetHotelsByCityQuery,
  useSubmitLeadMutation,
  useGetLeadsQuery,
  useUpdateLeadMutation,
  useGetLeadByIdQuery,
  useDeleteLeadMutation
} = tourApi;

