// src/api/baseQueryWithReauth.js
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:5000/api',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    console.warn('🔐 Token expired. Logging out and redirecting to login...');

    api.dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirect to login
window.location.href = '/';
  }

  return result;
};
