import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../hooks/useSessionStore';

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useSessionStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, ensure the user has one of the allowed roles
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Not authorized, bounce them back
    // Depending on their actual role, we could redirect them to their respective dashboards
    if (user.role === 'cashier') return <Navigate to="/pos" replace />;
    if (user.role === 'manager') return <Navigate to="/manager" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    
    // Ultimate fallback
    return <Navigate to="/login" replace />;
  }

  return children;
}
