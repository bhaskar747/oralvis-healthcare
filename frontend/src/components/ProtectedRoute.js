import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  // 1. While authentication is loading, show a spinner
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 2. If not loading and no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If user exists but doesn't have the required role, redirect to home
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // 4. If all checks pass, show the page
  return children;
};

export default ProtectedRoute;
