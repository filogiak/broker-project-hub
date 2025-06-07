import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import CreateOwnBrokerageForm from '@/components/brokerage/CreateOwnBrokerageForm';
import MainLayout from '@/components/layout/MainLayout';

const Dashboard = () => {
  const { user, loading, refreshUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Force page refresh to ensure clean logout
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
      // Check if brokerage owner has a brokerage
      if (user.brokerageId) {
        return <Navigate to="/brokerage-owner" replace />;
      } else {
        // Show form to create brokerage
        return (
          <MainLayout 
            title="Create Your Brokerage" 
            userEmail={user.email}
            onLogout={handleLogout}
          >
            <CreateOwnBrokerageForm onSuccess={refreshUser} />
          </MainLayout>
        );
      }
    case 'broker_assistant':
      if (user.brokerageId) {
        return <Navigate to={`/brokerage/${user.brokerageId}`} replace />;
      }
      break;
    case 'mortgage_applicant':
    case 'real_estate_agent':
      // These users should be redirected to specific projects they have access to
      // For now, we'll keep them on a general dashboard
      break;
  }

  // Fallback dashboard view
  return (
    <MainLayout 
      title="Dashboard" 
      userEmail={user.email}
      onLogout={handleLogout}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">Dashboard</h1>
        <div className="bg-background rounded-lg shadow-sm p-6">
          <p className="text-muted-foreground">
            Welcome {user.firstName} {user.lastName}! Your role: {user.roles.join(', ')}
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
