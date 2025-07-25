// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useGetProfileQuery } from '../redux/api/authApi';

const ProtectedRoute = () => {
  const { data, error, isLoading } = useGetProfileQuery();

  if (isLoading) return <p>Loading...</p>;

  if (error || !data?.user) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
