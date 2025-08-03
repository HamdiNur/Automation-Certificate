import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useGetProfileQuery } from '../redux/api/authApi';

const ProtectedRoute = () => {
  const { data, error, isLoading } = useGetProfileQuery();
  const location = useLocation();

  if (isLoading) return <p>Loading...</p>;

  if (error || !data?.user) return <Navigate to="/" replace />;

  const userRole = data.user.role; // e.g., "finance", "faculty", "admin"
  const path = location.pathname;

  const roleAccess = {
    exam_office: ['/dashboard', '/requests', '/appointments', '/profile', '/name-corrections', '/examination/chat','/courses'],
    faculty: ['/faculty'],
    finance: ['/finance'],
    lab: ['/lab'],
    library: ['/library'],
  };

  const hasAccess = Object.entries(roleAccess).some(([role, prefixes]) =>
    userRole === role && prefixes.some(prefix => path.startsWith(prefix))
  );

  if (!hasAccess) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
