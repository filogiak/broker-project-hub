
import React from 'react';
import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to login page as the default landing
  return <Navigate to="/login" replace />;
};

export default Index;
