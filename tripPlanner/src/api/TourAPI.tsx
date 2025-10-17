import { createApi, fetchBaseQuery, FetchBaseQueryMeta } from '@reduxjs/toolkit/query/react';
import {AUTHENTICATE,BASE_URL,BASE_URL_JWT,GET_ALL_BOOKINGS,GET_BOOKING_BY_ID,LOGIN,REGISTRATION,} from '../utils/ApiConstants.ts';
import { Lead } from '../types/types.ts';
import TokenService from '../pages/tokenService.ts';
import { TourBookingData } from '../types/package.types.ts';
import { RootState } from '../store/store.tsx';
import { removeHotel } from '../store/slices/hotelSlice.ts';
import { removeTourFromDay } from '../store/slices/tripPlannerSlice.ts';

export const tourApi = createApi({
  reducerPath: 'tourApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const { token, user } = state.auth;

      headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (user?.email) headers.set('User-Email', user.email);
      headers.set('User-Role', user?.role ?? 'USER');

      return headers;
    },
  }),
  tagTypes: ['Bookings', 'Lead', 'Package', 'UserCompany','Planner'],
  endpoints: (builder) => ({
    // ----- Hotels -----
    getHotelsByCity: builder.query<any, { city: string; country: string }>({
      query: ({ city, country }) =>
        `sightTour/hotelbyCity?city=${city}&country=${country}`,
    }),

    // ----- Leads -----
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
      query: ({ id, lead }) => ({
        url: `/sightTour/lead/${id}`,
        method: 'PUT',
        body: lead,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
      ],
    }),
    
    addPlannerItem: builder.mutation<any, any>({
      query: (body) => ({
        url: "/sightTour/planner/add",
        method: "POST",
        body,
      }),
    }),
    getLeadById: builder.query<any, string>({
      query: (id) => `/sightTour/lead/${id}`,
    }),

    deleteLead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/sightTour/lead/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lead'],
    }),

    // ----- Packages -----
    searchPackages: builder.query< any, { country: string; city: string; startDate: string; endDate: string }>({
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
      providesTags: (_result, _error, id) => [{ type: 'Package', id }],
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
      query: () => '/sightTour/packageData',
      providesTags: ['Package'],
    }),

    getFilteredPackages: builder.query<any, { city?: string; country?: string; nights?: number; theme?: string }>({
      query: ({ city, country, nights, theme }) => {
        const params = new URLSearchParams();
        if (city?.trim()) params.append('city', city.trim());
        if (country?.trim()) params.append('country', country.trim());
        if (nights) params.append('nights', nights.toString());
        if (theme?.trim()) params.append('theme', theme.trim());
        const queryString = params.toString();
        return `sightTour/packages/filter${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Package'],
    }),
    // ----- Bookings -----
    getAllBookings: builder.query<TourBookingData[], void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const response = await baseQuery(GET_ALL_BOOKINGS);
        if (response.error) return { error: response.error };
        const bookings = response.data as TourBookingData[];
        const state = _api.getState() as RootState;
        const email = state.auth.user?.email ?? '';
        const filtered: TourBookingData[] = bookings.filter(
          (b) => b.bookingData?.email?.toLowerCase() === email.toLowerCase()
        );
        return { data: filtered };
      },
      providesTags: ['Bookings'],
    }),

    getBookingById: builder.query<TourBookingData, string>({
      query: (id) => GET_BOOKING_BY_ID + id,
      providesTags: (result, error, id) => [{ type: 'Bookings', id }],
    }),
    // ----- Authentication -----
    loginUser: builder.mutation<{ accessToken: string; refreshToken: string; username?: string; email?: string; message?: string },{ identifier: string; password: string }>({
      query: (credentials) => ({
        url: LOGIN,
        method: 'POST',
        body: credentials,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Email': credentials.identifier,
          'User-Role': 'USER',
        },
      }),
      transformResponse: (response: any) => {
        if (response.token && response.refreshToken) {
          TokenService.setTokens(response.token, response.refreshToken, response.username);
        }
        return response;
      },
    }),

    logoutUser: builder.mutation<{ message: string }, void>({
      query: () => ({ url: '/logout', method: 'POST', headers: TokenService.getAuthHeaders() }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          TokenService.clearTokensAndRedirect();
        } catch (error) {
          TokenService.clearTokensAndRedirect();
        }
      },
    }),

    changePassword: builder.mutation< { message: string }, { email: string; mobile: string; newPassword: string }>({
      query: (passwordData) => ({
        url: `${BASE_URL_JWT}/sso/forgot-password`,
        method: 'POST',
        body: passwordData,
      }),
    }),

    authenticateToken: builder.mutation<{ token: string; refreshToken: string; refreshed?: boolean }, { accessToken: string; refreshToken: string }>({
      query: (tokens) => ({
        url: AUTHENTICATE,
        method: 'POST',
        body: tokens,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      }),
    }),

    registerUser: builder.mutation<{ message: string }, { username: string; email: string; password: string; mobile: string; companyName: string }>({
      query: (user) => ({
        url: REGISTRATION,
        method: 'POST',
        body: JSON.stringify(user),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      }),
    }),

    getUserCompanyInfo: builder.query<{ companyName: string; logoPath: string; username: string; message: string }, string >({
      query: (email) => ({
        url: `${BASE_URL_JWT}/sso/user-company-info`,
        method: 'POST',
        body: { email },
      }),
      providesTags: ['UserCompany'],
    }),

    uploadLogo: builder.mutation< { success: boolean; message: string; logoUrl?: string; filename?: string },{ file: File; email: string } >({
      queryFn: async ({ file, email }) => {
        if (!file) return { error: { status: 400, data: { message: 'No file selected' } } };
        if (!['image/png', 'image/jpeg', 'image/jpg', 'image/gif'].includes(file.type))
          return { error: { status: 400, data: { message: 'Invalid file type' } } };
        const formData = new FormData();
        formData.append('file', file);
        formData.append('email', email);

        try {
          const response = await fetch(`${BASE_URL_JWT}/sso/upload-logo`, { method: 'POST', body: formData });
          if (!response.ok) {
            const text = await response.text();
            return { error: { status: response.status, data: text } };
          }
          const result = await response.json();
          return { data: { success: true, ...result } };
        } catch (error) {
          return { error: { status: 500, data: 'Network error' } };
        }
      },
      invalidatesTags: ['UserCompany'],
    }),

    getLogoAsDataUrl: builder.query<string, string>({
      queryFn: async (filename) => {
        if (!filename) return { error: { status: 400, data: 'No filename provided' } };
        try {
          const url = `${BASE_URL_JWT}/sso/logos/${encodeURIComponent(filename)}`;
          const response = await fetch(url, { method: 'GET' });
          if (!response.ok) return { error: { status: response.status, data: 'Logo not found' } };
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          return { data: dataUrl };
        } catch (error) {
          return { error: { status: 500, data: 'Network error' } };
        }
      },
      keepUnusedDataFor: 3600,
    }),
    updateSearchParams: builder.mutation<{ status: string; data: string }, any>({
      query: (searchParams) => ({
        url: "planner/search-params",
        method: "POST",
        body: searchParams,
      }),
    }),
    saveSearchParams: builder.mutation<{ status: string; data: string }, any>({
      query: (searchParams) => ({
        url: 'sightTour/planner/search-params',
        method: 'POST',
        body: {
          ...searchParams,
          isNewSearch: false,
          timestamp: Date.now()
        },
      }),
    }),
    
    loadPlannerData: builder.query<any, string>({
      query: (sessionId) => ({
        url: `sightTour/planner?sessionId=${sessionId}`,
        method: 'GET',
      }),
      providesTags: ['Planner'],
    }),
    ////1
    syncHotelToBackend: builder.mutation<any, any>({
      query: (hotelData) => ({
        url: 'sightTour/planner',
        method: 'POST',
        body: hotelData,
      }),
      invalidatesTags: ['Lead'],
    }),
    
    syncTourToBackend: builder.mutation<any, any>({
      query: (tourData) => ({
        url: 'sightTour/planner',
        method: 'POST',
        body: {
          ...tourData,
          dataType: 'tour',
          preserveExisting: true
        },
      }),
      invalidatesTags: ['Lead'],
    }),
    
    removeHotelFromPlanner: builder.mutation<any, { uniqueId: string; sessionId: string }>({
      query: ({ uniqueId, sessionId }) => ({
        url: `sightTour/planner/hotel/${uniqueId}?sessionId=${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lead'],
      async onQueryStarted({ uniqueId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(removeHotel(uniqueId));
        } catch (error) {
          console.error('Failed to remove hotel:', error);
        }
      },
    }),
    
    removeTourFromPlanner: builder.mutation<any, { uniqueId: string; sessionId: string; specificDayId: string }>({
      query: ({ uniqueId, sessionId }) => ({
        url: `sightTour/planner/tour/${uniqueId}?sessionId=${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lead'],
      async onQueryStarted({ specificDayId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(removeTourFromDay(specificDayId));
        } catch (error) {
          console.error('Failed to remove tour:', error);
        }
      },
    }),
    loadPlannerDataFromBackend: builder.query<{
      allHotels: any[];
      plannerItems: any[];
      searchParams: any;
      sessionId: string;
    }, string>({
      query: (sessionId) => `sightTour/planner?sessionId=${sessionId}`,
      providesTags: ['Planner'],
    }),
    saveItineraryToBackend: builder.mutation<any, {specificDayId: string; itinerary: any;sessionId: string; }>({
      query: ({ specificDayId, itinerary, sessionId }) => ({
        url: 'sightTour/planner',
        method: 'POST',
        body: {
          specificDayId,
          itinerary,
          sessionId,
          dataType: 'itinerary',
          timestamp: Date.now(),
        },
      }),
      invalidatesTags: ['Planner'],
    }),
  }),
  

});

export const {
  useUpdateSearchParamsMutation,
  useGetHotelsByCityQuery,
  useSubmitLeadMutation,
  useGetLeadsQuery,
  useUpdateLeadMutation,
  useGetLeadByIdQuery,
  useDeleteLeadMutation,
  useSearchPackagesQuery,
  useGetAllPackagesQuery,
  useGetPackageByIdQuery,
  useSubmitPackageDataMutation,
  useGetAllPackageDataQuery: useGetAllPackageDataQuery,
  useGetFilteredPackagesQuery,
  useGetAllBookingsQuery,
  useGetBookingByIdQuery,
  useLoginUserMutation,
  useLogoutUserMutation,
  useChangePasswordMutation,
  useAuthenticateTokenMutation,
  useRegisterUserMutation,
  useGetUserCompanyInfoQuery,
  useUploadLogoMutation,
  useGetLogoAsDataUrlQuery,
  useAddPlannerItemMutation,
  useSaveSearchParamsMutation,
  useLoadPlannerDataQuery,
  useSyncHotelToBackendMutation,
  useSyncTourToBackendMutation,
  useRemoveHotelFromPlannerMutation,
  useRemoveTourFromPlannerMutation,
  useLazyLoadPlannerDataQuery,
  useLoadPlannerDataFromBackendQuery,
  useLazyLoadPlannerDataFromBackendQuery,
  useSaveItineraryToBackendMutation
} = tourApi;

