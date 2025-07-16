import React, { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { logout } from '@/services/authService';
import CreateOwnBrokerageForm from '@/components/brokerage/CreateOwnBrokerageForm';
import MainLayout from '@/components/layout/MainLayout';
import PendingInvitationsWidget from '@/components/dashboard/PendingInvitationsWidget';
import RoleSelector from '@/components/dashboard/RoleSelector';
import { toast } from 'sonner';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import SimulationCollaboratorDashboard from './SimulationCollaboratorDashboard';
import RealEstateAgentDashboard from './RealEstateAgentDashboard';
import BrokerAssistantDashboard from './BrokerAssistantDashboard';
import MortgageApplicantDashboard from './MortgageApplicantDashboard';
import type { AuthUser } from '@/services/authService';

// Helper function to render role-specific content for multi-role users
const renderRoleSpecificContent = (
  activeRole: string,
  user: AuthUser,
  refreshUser: () => Promise<void>,
  handleLogout: () => Promise<void>,
  invitationCount: number,
  invitations: any[]
) => {
  switch (activeRole) {
    case 'superadmin':
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Admin Dashboard</h2>
          <p className="text-muted-foreground mb-4">Use the admin panel for administrative tasks.</p>
          <a href="/admin" className="text-primary hover:underline">Go to Admin Panel</a>
        </div>
      );
      
    case 'brokerage_owner':
      if (user.brokerageId) {
        return (
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-primary mb-4">Brokerage Owner Dashboard</h2>
            <p className="text-muted-foreground mb-4">Manage your brokerage operations.</p>
            <a href={`/brokerage/${user.brokerageId}`} className="text-primary hover:underline">Go to Brokerage Dashboard</a>
          </div>
        );
      } else {
        return <CreateOwnBrokerageForm onSuccess={refreshUser} />;
      }
      
    case 'broker_assistant':
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Broker Assistant Dashboard</h2>
          <p className="text-muted-foreground mb-4">Access your broker assistant tools and projects.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background rounded-lg shadow-sm p-6">
                <h3 className="font-semibold mb-2">Organizations</h3>
                <p className="text-sm text-muted-foreground mb-4">Manage organizations you're part of</p>
                <a href="/broker-assistant/organizations" className="text-primary hover:underline">View Organizations</a>
              </div>
              <div className="bg-background rounded-lg shadow-sm p-6">
                <h3 className="font-semibold mb-2">Invitations</h3>
                <p className="text-sm text-muted-foreground mb-4">Review pending invitations</p>
                <a href="/broker-assistant/invitations" className="text-primary hover:underline">View Invitations</a>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'real_estate_agent':
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Real Estate Agent Dashboard</h2>
          <p className="text-muted-foreground mb-4">Access your real estate tools and client projects.</p>
          <PendingInvitationsWidget />
        </div>
      );
      
    case 'mortgage_applicant':
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Mortgage Applicant Dashboard</h2>
          <p className="text-muted-foreground mb-4">Track your mortgage application progress.</p>
          <PendingInvitationsWidget />
        </div>
      );
      
    case 'simulation_collaborator':
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Simulation Collaborator Dashboard</h2>
          <p className="text-muted-foreground mb-4">Collaborate on mortgage simulations.</p>
          <PendingInvitationsWidget />
        </div>
      );
      
    default:
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-primary">Welcome {user.firstName} {user.lastName}!</h1>
          
          {invitationCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
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
                Active role: <span className="font-medium">{activeRole ? activeRole.replace('_', ' ') : 'Loading...'}</span>
              </p>
              {!invitationCount && (
                <p className="text-sm text-muted-foreground mt-2">
                  No pending invitations at the moment.
                </p>
              )}
            </div>
            
            <PendingInvitationsWidget />
          </div>
        </div>
      );
  }
};

const Dashboard = () => {
  const { user, loading, refreshUser } = useAuth();
  const { selectedRole, isMultiRole } = useRoleSelection();
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
        selectedRole,
        invitationsList: invitations
      });
    }
  }, [user, invitations, invitationCount, invitationsLoading, selectedRole]);

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

  // Use selected role for routing decisions, fallback to primary role
  const activeRole: string = selectedRole || user.roles[0];

  // For multi-role users, use conditional rendering instead of redirects to allow role switching
  if (isMultiRole) {
    // Render dashboard based on selected role with role selector
    return (
      <MainLayout 
        title="Dashboard" 
        userEmail={user.email}
        onLogout={handleLogout}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <RoleSelector />
          {renderRoleSpecificContent(activeRole, user, refreshUser, handleLogout, invitationCount, invitations)}
        </div>
      </MainLayout>
    );
  }

  // For single-role users, use traditional routing
  switch (activeRole) {
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
            <div className="max-w-4xl mx-auto">
              <CreateOwnBrokerageForm onSuccess={refreshUser} />
            </div>
          </MainLayout>
        );
      }
      
    case 'broker_assistant':
      return <BrokerAssistantDashboard />;
      
    case 'real_estate_agent':
      return <RealEstateAgentDashboard />;
      
    case 'mortgage_applicant':
      return <MortgageApplicantDashboard />;
      
    case 'simulation_collaborator':
      return <SimulationCollaboratorDashboard />;
      
    default:
      // Fallback dashboard for users without specific roles or multi-role users
      const showInvitationPrompt = invitationCount > 0;

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
                  Welcome {user.firstName} {user.lastName}! 
                  {isMultiRole ? (
                    <span className="block mt-1">
                      Active role: <span className="font-medium">{activeRole ? activeRole.replace('_', ' ') : 'Loading...'}</span>
                    </span>
                  ) : (
                    <span> Your role: {user.roles.join(', ')}</span>
                  )}
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
  }
};

export default Dashboard;
