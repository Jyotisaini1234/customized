import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AUTHENTICATE, BASE_URL, BASE_URL_JWT, GET_ALL_BOOKINGS, GET_BOOKING_BY_ID, LOGIN, REGISTRATION } from '../utils/ApiConstants.ts';
import { Lead, TourBookingData } from '../types/types.ts';
import TokenService from '../pages/tokenService.ts';
import { getFromDB, STORES, saveToDB } from '../utils/TripPlannerDB.ts';

const getUserEmail = async (): Promise<string> => {
  try {
    const email = await getFromDB(STORES.plannerData, 'userEmail', '') ||await getFromDB(STORES.plannerData, 'username', '') || await getFromDB(STORES.plannerData, 'email', '');
    console.log('getUserEmail() returning:', email);
    return email;
  } catch (error) {
    console.error('Error getting user email from IndexedDB:', error);
    return '';
  }
};

const getUserRole = async (): Promise<string> => {
  try {
    return await getFromDB(STORES.plannerData, 'userRole', 'USER');
  } catch (error) {
    console.error('Error getting user role from IndexedDB:', error);
    return 'USER';
  }
};

export const tourApi = createApi({
  
  reducerPath: 'tourApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    prepareHeaders: async (headers) => {
      headers.set('Content-Type', 'application/json');
      const userEmail = await getUserEmail();
      const userRole = await getUserRole();
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
    transformResponse: async (response: any) => {
      console.log('Get all bookings response:', response);
      const userEmail = await getUserEmail();
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
    queryFn: async (id, api, extraOptions, baseQuery) => {
      const userEmail = await getUserEmail();
      const userRole = await getUserRole();
      
      return baseQuery({
        url: `${GET_BOOKING_BY_ID}${id}`,
        method: 'GET',
        headers: { 
          'User-Email': userEmail,
          'User-Role': userRole,
        },
      });
    },
    providesTags: (result, error, id) => [{ type: 'Bookings', id }],
    transformResponse: (response: any) => { 
      console.log('Get booking by ID response:', response); 
      return response; 
    },
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
    { accessToken: string; token: string;  refreshToken: string; message?: string; username?: string; email?: string;},
    { identifier: string; password: string }
  >({
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
    transformResponse: async (response: any, meta, arg) => {
      if (response.token && response.refreshToken) {
        const username = response.username || response.user || 'User';
        const email = response.email || response.username || arg.identifier;
        
        // Store user data in IndexedDB instead of localStorage
        try {
          await Promise.all([
            saveToDB(STORES.plannerData, 'userEmail', email),
            saveToDB(STORES.plannerData, 'username', email),
            saveToDB(STORES.plannerData, 'email', email),
            saveToDB(STORES.plannerData, 'userRole', 'USER')
          ]);
          console.log('User data stored in IndexedDB');
        } catch (error) {
          console.error('Error storing user data in IndexedDB:', error);
        }
        
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
  { success: boolean; message: string; logoUrl?: string; filename?: string },
  { file: File; email: string }
>({
  queryFn: async ({ file, email }) => {
    // Validation
    if (!file) return { error: { status: 400, data: { message: 'No file selected' } } };
    if (file.size > 5 * 1024 * 1024) return { error: { status: 400, data: { message: 'File too large' } } };
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/gif'].includes(file.type)) {
      return { error: { status: 400, data: { message: 'Invalid file type' } } };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', email);

      const response = await fetch(`${BASE_URL_JWT}/sso/upload-logo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Upload failed:', response.status, errorData);
        return { error: { status: response.status, data: { message: 'Upload failed' } } };
      }

      const result = await response.json();
      return { 
        data: {
          success: true,
          message: result.message || 'Upload successful',
          logoUrl: result.logoUrl || '',
          filename: result.filename || ''
        }
      };
    } catch (error) {
      console.error('Upload network error:', error);
      return { error: { status: 500, data: { message: 'Network error' } } };
    }
  },
  invalidatesTags: ['UserCompany'],
}),

getLogoAsDataUrl: builder.query<string, string>({
  queryFn: async (filename) => {
    // Skip if no filename provided
    if (!filename || filename.trim() === '') {
      return { error: { status: 400, data: 'No filename provided' } };
    }

    try {
      // Clean the filename - remove any URL encoding or special characters that might cause issues
      const cleanFilename = encodeURIComponent(filename.trim());
      const logoUrl = `${BASE_URL_JWT}/sso/logos/${cleanFilename}`;
      
      console.log('Attempting to fetch logo from:', logoUrl);

      const response = await fetch(logoUrl, {
        method: 'GET',
        credentials: 'include',
        headers: { 
          'Accept': 'image/*',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        console.error(`Logo fetch failed: ${response.status} ${response.statusText} for URL: ${logoUrl}`);
        
        // Try alternative approaches if the direct fetch fails
        if (response.status === 404) {
          // Maybe the file has a different extension or encoding
          const alternativeExtensions = ['png', 'jpg', 'jpeg', 'gif'];
          const baseFilename = filename.replace(/\.[^/.]+$/, ""); // Remove extension
          
          for (const ext of alternativeExtensions) {
            try {
              const altUrl = `${BASE_URL_JWT}/sso/logos/${encodeURIComponent(baseFilename)}.${ext}`;
              console.log('Trying alternative URL:', altUrl);
              
              const altResponse = await fetch(altUrl, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'image/*' }
              });
              
              if (altResponse.ok) {
                const blob = await altResponse.blob();
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
                console.log('Successfully fetched logo from alternative URL:', altUrl);
                return { data: dataUrl };
              }
            } catch (altError) {
              console.log('Alternative fetch failed:', altError);
              continue;
            }
          }
        }
        
        return { error: { status: response.status, data: `Logo not found: ${response.statusText}` } };
      }

      const blob = await response.blob();
      
      // Validate that we actually got an image
      if (!blob.type.startsWith('image/')) {
        console.error('Response is not an image:', blob.type);
        return { error: { status: 400, data: 'Invalid image format received' } };
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });

      console.log('Successfully converted logo to data URL, size:', dataUrl.length);
      return { data: dataUrl };
      
    } catch (error) {
      console.error('Logo fetch network error:', error);
      return { error: { status: 500, data: 'Network error while fetching logo' } };
    }
  },
  keepUnusedDataFor: 3600, // Cache for 1 hour
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
  query: (email) => ({
    url: `${BASE_URL_JWT}/sso/user-company-info`,
    method: 'POST',
    body: { email },
  }),
  providesTags: ['UserCompany'],
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
  useGetLogoAsDataUrlQuery,
  // serveLogo
} = tourApi;