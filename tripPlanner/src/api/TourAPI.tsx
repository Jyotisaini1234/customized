import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASE_URL, BASE_URL_BACKEND } from '../utils/ApiConstants.ts';
import { Lead } from '../types/types.ts';

export const tourApi = createApi({
  reducerPath: 'tourApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      const userEmail = localStorage.getItem('username') || 'default@example.com';
      const userRole = 'USER';
      headers.set('User-Email', userEmail);
      headers.set('User-Role', userRole);
      return headers;
    },
  }),
  tagTypes: ['Bookings', 'Lead','Package'],
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
      query: () => ({
        url: '/sightTour/leads',
        method: 'GET',
      }),
      providesTags: ['Lead'],
    }),

    updateLead: builder.mutation<Lead, { id: string; lead: Partial<Lead> }>({
      query: ({ id, lead }) => {
        console.log('API: Updating lead with ID:', id);
        console.log('API: Lead data:', lead);
        
        return {
          url: `/sightTour/lead/${id}`,
          method: 'PUT',
          body: lead,
        };
      },
      transformResponse: (response: any) => {
        console.log(' Update successful:', response);
        return response;
      },
      transformErrorResponse: (response: any, meta: any, arg: any) => {
        console.error('API Update Error:', response);
        console.error('API Meta:', meta);
        console.error('API Args:', arg);
        return response;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' }
      ],
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
    
    searchPackages: builder.query<any, { 
      country: string; 
      city: string; 
      startDate: string; 
      endDate: string 
    }>({
      query: ({ country, city, startDate, endDate }) =>
        `sightTour/package-search?country=${country}&city=${city}&startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Package'],
    }),

    getAllPackages: builder.query<any, void>({
      query: () => 'sightTour/all-packages',
      providesTags: ['Package'],
    }),

    getPackageById: builder.query<any, string>({
      query: (id) => `sightTour/package/${id}`,
      providesTags: (_result, error, id) => [{ type: 'Package', id }],
    }),
    
    submitPackageData: builder.mutation<any, any>({
      query: (tripPlannerData) => ({
        url: '/sightTour/packageData',
        method: 'POST',
        body: tripPlannerData,
      }),
      invalidatesTags: ['Package'],
    }),
    
    getAllPackageData: builder.query<any[], void>({
      query: () => ({
        url: '/sightTour/packageData',
        method: 'GET',
      }),
      providesTags: ['Package'],
    }),
  }),
});

export const {
  useGetHotelsByCityQuery,
  useSubmitLeadMutation,
  useGetLeadsQuery,
  useUpdateLeadMutation,
  useGetLeadByIdQuery,
  useDeleteLeadMutation,
  useGetPackageByIdQuery,
  useSearchPackagesQuery,
  useGetAllPackagesQuery,
  useSubmitPackageDataMutation,
  useGetAllPackageDataQuery
} = tourApi;