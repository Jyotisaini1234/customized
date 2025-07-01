import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/authUtils.ts';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    return <Navigate to="https://b2b.flydivinetravels.com/hotel" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;