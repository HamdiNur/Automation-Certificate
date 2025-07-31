import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/users/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    getProfile: builder.query({
      query: () => '/users/profile',
      providesTags: ['Auth'],
    }),
  }),
});

// ✅ CORRECT HOOK EXPORT
export const { useLoginMutation, useGetProfileQuery } = authApi;
