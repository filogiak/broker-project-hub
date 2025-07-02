
import React, { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import CreateOwnBrokerageForm from '@/components/brokerage/CreateOwnBrokerageForm';
import MainLayout from '@/components/layout/MainLayout';
import PendingInvitationsWidget from '@/components/dashboard/PendingInvitationsWidget';
import RoleSelector from '@/components/dashboard/RoleSelector';
import { toast } from 'sonner';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';

const Dashboard = () => {
  const { user, loading, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { invitations, loading: invitationsLoading, invitationCount } = usePendingInvitations();

  const handleLogout = async () => {
    try {
      await logout();
      // Force page refresh to ensure clean logout
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Clean up URL parameters and show invitation message if needed
  useEffect(() => {
    if (user) {
      const hasInvitationContext = searchParams.has('invitation') || searchParams.has('accept_invitation');
      const redirectParam = searchParams.get('redirect');
      
      if (hasInvitationContext || redirectParam) {
        // Show toast message about checking invitations
        if (hasInvitationContext) {
          toast.info('Welcome! Check your pending invitations below to join projects.', {
            duration: 6000,
          });
        }
        
        // Clear URL parameters while preserving the current route
        setSearchParams({});
      }
    }
  }, [user, searchParams, setSearchParams]);

  // Debug logging for invitation status
  useEffect(() => {
    if (user && !invitationsLoading) {
      console.log('🔍 [DASHBOARD] Debug info:', {
        userEmail: user.email,
        invitationCount,
        invitations: invitations.length,
        userRoles: user.roles,
        invitationsList: invitations
      });
    }
  }, [user, invitations, invitationCount, invitationsLoading]);

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
        return <Navigate to={`/brokerage/${user.brokerageId}`} replace />;
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

  // Show prominent invitation section if user has pending invitations
  const showInvitationPrompt = invitationCount > 0;

  // Fallback dashboard view with pending invitations
  return (
    <MainLayout 
      title="Dashboard" 
      userEmail={user.email}
      onLogout={handleLogout}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-primary mb-6">Dashboard</h1>
        
        {/* Role Selector for multi-role users */}
        <RoleSelector />
        
        {showInvitationPrompt && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{invitationCount}</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-blue-900">
                  You have {invitationCount} pending invitation{invitationCount > 1 ? 's' : ''}!
                </h2>
                <p className="text-blue-700 text-sm">
                  Accept your invitation{invitationCount > 1 ? 's' : ''} below to join project{invitationCount > 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background rounded-lg shadow-sm p-6">
            <p className="text-muted-foreground">
              Welcome {user.firstName} {user.lastName}! Your role: {user.roles.join(', ')}
            </p>
            {!showInvitationPrompt && (
              <p className="text-sm text-muted-foreground mt-2">
                No pending invitations at the moment.
              </p>
            )}
          </div>
          
          <PendingInvitationsWidget />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
