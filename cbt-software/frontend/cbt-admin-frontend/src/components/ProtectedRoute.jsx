import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="card">Loading authentication...</div>; // Or a proper spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles)) {
    if (!user || !allowedRoles.includes(user.role)) {
      return <div className="card">Not authorized to access this page.</div>;
    }
  }
  return children;
}
