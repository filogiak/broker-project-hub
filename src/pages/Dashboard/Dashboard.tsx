import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect based on user's primary role
  const primaryRole = user.roles[0]; // Assuming first role is primary

  switch (primaryRole) {
    case 'superadmin':
      return <Navigate to="/admin" replace />;
    case 'brokerage_owner':
    case 'broker_assistant':
      if (user.brokerageId) {
        return <Navigate to={`/brokerage/${user.brokerageId}`} replace />;
      }
      break;
    case 'external_broker':
    case 'applicant':
    case 'agent':
      // These users should be redirected to specific projects they have access to
      // For now, we'll keep them on a general dashboard
      break;
  }

  // Fallback dashboard view
  return (
    <div className="min-h-screen bg-background-cream p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">Dashboard</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-muted-foreground">
            Welcome {user.firstName} {user.lastName}! Your role: {user.roles.join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
