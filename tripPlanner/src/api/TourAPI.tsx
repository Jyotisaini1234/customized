import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AUTHENTICATE, BASE_URL, BASE_URL_JWT, GET_ALL_BOOKINGS, GET_BOOKING_BY_ID, LOGIN, REGISTRATION } from '../utils/ApiConstants.ts';
import { BookingData, Lead, TourBookingData } from '../types/types.ts';
import TokenService from '../pages/tokenService.ts';

const getUserEmail = () => {
  const email = localStorage.getItem('userEmail') ||
                localStorage.getItem('username') ||
                localStorage.getItem('email') || '';
  
  console.log('getUserEmail() returning:', email);
  return email;
};

const getUserRole = () => {
  return localStorage.getItem('userRole') || 'USER';
};
export const tourApi = createApi({
  reducerPath: 'tourApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      const userEmail = getUserEmail();
      const userRole = getUserRole();
      console.log('API Headers - User-Email:', userEmail);
      console.log('API Headers - User-Role:', userRole);
      
      headers.set('User-Email', userEmail);
      headers.set('User-Role', userRole);
      return headers;
    },
  }),
  tagTypes: ['Bookings', 'Lead','Package','UserCompany'],
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

  getFilteredPackages: builder.query<any, { 
    city?: string;
    country?: string;
    nights?: number;
    theme?: string;
  }>({
    query: ({ city, country, nights, theme }) => {
      const params = new URLSearchParams();
      
      if (city && city.trim()) params.append('city', city.trim());
      if (country && country.trim()) params.append('country', country.trim());
      if (nights) params.append('nights', nights.toString());
      if (theme && theme.trim()) params.append('theme', theme.trim());
      
      const queryString = params.toString();
      return `https://b2b.flydivinetravels.com/sightTour/packages/filter${queryString ? `?${queryString}` : ''}`;
    },
    providesTags: ['Package'],
    transformResponse: (response: any) => {
      console.log('Filtered packages response:', response);
      return response;
    },
  }),


  getAllBookings: builder.query<TourBookingData[], void>({
    query: () => GET_ALL_BOOKINGS,
    providesTags: ['Bookings'],
    transformResponse: (response: any) => {
      console.log('Get all bookings response:', response);
      const userEmail = getUserEmail();
      console.log('Filtering bookings for email:', userEmail);
      if (Array.isArray(response)) {
        const filteredBookings = response.filter(booking => 
          booking.bookingData?.email?.toLowerCase() === userEmail.toLowerCase()
        );
        console.log('Filtered bookings count:', filteredBookings.length);
        return filteredBookings;
      }
      return response;
    },
  }),
  
  getBookingById: builder.query<TourBookingData, string>({
    query: (id) => ({
      url: `${GET_BOOKING_BY_ID}${id}`,
      method: 'GET',
      headers: { 'User-Email': getUserEmail(),'User-Role': getUserRole(), },
    }),
    providesTags: (result, error, id) => [{ type: 'Bookings', id }],
    transformResponse: (response: any) => { console.log('Get booking by ID response:', response); return response; },
  }),

  authenticateToken: builder.mutation<  { token: string; refreshToken: string; refreshed?: boolean }, { accessToken: string; refreshToken: string } >({
        query: (tokens) => ({ url: AUTHENTICATE, method: 'POST', body: tokens,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',},
        }),
      }),

      logoutUser: builder.mutation<{ message: string }, void>({
        query: () => ({ url: '/logout', method: 'POST', headers: TokenService.getAuthHeaders(), }),
        async onQueryStarted(arg, { dispatch, queryFulfilled }) {
          try {
            await queryFulfilled;
            TokenService.clearTokensAndRedirect();
          } catch (error) {
            console.error('Logout error:', error);
            TokenService.clearTokensAndRedirect();
          }
        },
      }),
loginUser: builder.mutation<
  { accessToken: string; token: string;  refreshToken: string; message?: string; username?: string; email?: string;},{ identifier: string; password: string }>({
  query: (credentials) => ({
    url: LOGIN,
    method: 'POST',
    body: credentials,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Email': credentials.identifier,
      'User-Role': 'USER', },
  }),
  transformResponse: (response: any, meta, arg) => {
    if (response.token && response.refreshToken) {
      const username = response.username || response.user || 'User';
      const email = response.email || response.username || arg.identifier;
      localStorage.setItem('userEmail', email);
      localStorage.setItem('username', email);
      localStorage.setItem('email', email);
      localStorage.setItem('userRole', 'USER');
      TokenService.setTokens(response.token, response.refreshToken, username);
    }
    return response;
  },
  transformErrorResponse: (response: any) => {
    console.error('Login error:', response);
    if (response.data?.message) {
      return { message: response.data.message };
    }
    return { message: 'Login failed. Please check your credentials.' };
  },
}),

  changePassword: builder.mutation<
      { message: string },
      { email: string; mobile: string; newPassword: string }
    >({
      query: (passwordData) => ({
        url: `${BASE_URL_JWT}/sso/forgot-password`,
        method: 'POST',
        body: passwordData,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }),
      transformResponse: (response: any) => {
        console.log('Password change response:', response);
        return response;
      },
      transformErrorResponse: (response: any) => {
        console.error('Password change error:', response);
        console.error('Full error response:', response);
        if (response.data?.message) {
          return { message: response.data.message };
        }
        if (response.status) {
          return { message: `Error ${response.status}: ${response.statusText || 'Password change failed'}` };
        }
        return { message: 'Password change failed. Please try again.' };
      },
    }),
uploadLogo: builder.mutation<
{
  filename: any;
  filePath: any; message: string; data?: string; success?: boolean 
},
{ file: File; email: string }>({
queryFn: async ({ file, email }) => {
  try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', email);
      const response = await fetch('https://b2b.flydivinetravels.com/sso/upload-logo', {
        method: 'POST',
        body: formData,});
        if (!response.ok) {
        const errorText = await response.text();
        console.error('RTK Query upload error response:', errorText);
        return {
          error: {
            status: response.status,
            data: { 
              message: `Upload failed: ${response.statusText || 'Unknown error'}`,
              details: errorText
            } }};}

    const result = await response.json();
    console.log('RTK Query upload success:', result);
    
    return { data: result };
    
    } catch (error) {
      console.error('RTK Query upload network error:', error);
      return {
        error: {
          status: 'FETCH_ERROR' as const,
          data: { 
            message: 'Network error during logo upload. Please try again.',
            details: error instanceof Error ? error.message : 'Unknown error'
    }
        }};}},
}),
  
  registerUser: builder.mutation<
  { message: string }, 
  { username: string; email: string; password: string; mobile: string; companyName: string }
>({
  query: (user) => {
    console.log('Registration URL:', REGISTRATION);
    console.log('Base URL:', BASE_URL);
    console.log('Full URL:', `${BASE_URL}${REGISTRATION}`);
    
    return {
      url: REGISTRATION,
      method: 'POST',
      body: JSON.stringify(user),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
  },
  transformResponse: (response: any) => {
    console.log('Registration response:', response);
    console.log('Response type:', typeof response);
    if (typeof response === 'string' && response.includes('<!doctype')) {
      throw new Error('Server returned HTML instead of JSON');
    }
    
    return response;
  },
  transformErrorResponse: (response: any) => {
    console.error('Registration error details:', response);
    console.error('Error status:', response.status);
    console.error('Error data type:', typeof response.data);
    if (response.status === 'PARSING_ERROR' && 
        typeof response.data === 'string' && 
        response.data.includes('<!doctype')) {
      return { 
        message: 'API endpoint not found. Please check server configuration.' 
      };
    }
    if (response.data?.message) {
      return { message: response.data.message };
    }
    if (response.status === 404) {
      return { message: 'Registration endpoint not found. Please contact support.' };
    }
    if (response.status === 500) {
      return { message: 'Server error. Please try again later.' };
    }
    return { message: 'Registration failed. Please try again.' };
  },
}),

getUserCompanyInfo: builder.query<{
  companyName: string;
  logoPath: string;
  username: string;
  message: string;
}, string>({
  query: (email) => {
    console.log('Fetching company info for email:', email);
    return {
      url: `${BASE_URL_JWT}/sso/user-company-info`,
      method: 'POST',
      body: { email },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
  },
  providesTags: ['UserCompany'],
  transformResponse: (response: any, meta, arg) => {
    console.log('Get user company info response:', response);
    console.log('Response headers:', meta?.response?.headers);
    if (response && typeof response === 'object') {
      return {
        companyName: response.companyName || '',
        logoPath: response.logoPath || '',
        username: response.username || '',
        message: response.message || 'Success',
      };
    }
    
    throw new Error('Invalid response format');
  },
  transformErrorResponse: (response: any, meta, arg) => {
    console.error('Get user company info error:', response);
    console.error('Error meta:', meta);
    console.error('Request arg:', arg);
    
    // Handle different error types
    if (response.status === 'PARSING_ERROR') {
      console.error('Parsing error - likely received HTML instead of JSON');
      return { 
        message: 'Server returned invalid response. Please check API endpoint and authentication.' 
      };
    }
    
    if (response.status === 401) {
      return { message: 'Authentication required. Please login again.' };
    }
    
    if (response.status === 403) {
      return { message: 'Access forbidden. Check your permissions.' };
    }
    
    if (response.data?.message) {
      return { message: response.data.message };
    }
    
    return {
      message: `Failed to retrieve user company information. Status: ${response.status}` 
    };
  },
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
  useGetAllPackageDataQuery,
  useGetAllBookingsQuery,
  useGetBookingByIdQuery,
  useGetFilteredPackagesQuery,
  useRegisterUserMutation,
  useLoginUserMutation,
  useChangePasswordMutation,
  useUploadLogoMutation,
  useAuthenticateTokenMutation,
  useLogoutUserMutation,
  useGetUserCompanyInfoQuery,
} = tourApi;



