
import React from 'react';
import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to dashboard - the dashboard will handle auth redirects
  return <Navigate to="/dashboard" replace />;
};

export default Index;
