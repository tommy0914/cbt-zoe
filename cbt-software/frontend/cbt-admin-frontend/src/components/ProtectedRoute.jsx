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

  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    // 1. Check global role (superAdmin has access to everything)
    const isSuperAdmin = user?.role === 'superAdmin' || user?.email === 'sobalajetomiwa@gmail.com';
    
    // 2. Check school-specific roles
    const hasSchoolPermission = user?.schools?.some(school => allowedRoles.includes(school.role));

    if (!isSuperAdmin && !hasSchoolPermission) {
      return (
        <div className="card">
          <h1>Not Authorized</h1>
          <p>You do not have the required permissions to view this page.</p>
          <Navigate to="/" />
        </div>
      );
    }
  }
  return children;
}
