
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PostAuthInvitationService } from '@/services/postAuthInvitationService';
import MainLayout from '@/components/layout/MainLayout';
import PendingInvitationsWidget from '@/components/dashboard/PendingInvitationsWidget';
import AccessibleBrokerages from '@/components/dashboard/AccessibleBrokerages';
import SimulationCollaboratorDashboard from './SimulationCollaboratorDashboard';
import MortgageApplicantDashboard from './MortgageApplicantDashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { selectedRole, availableRoles } = useRoleSelection();
  const navigate = useNavigate();
  const [processingInvitation, setProcessingInvitation] = useState(false);

  // Process pending invitations when user first loads dashboard
  useEffect(() => {
    const processPendingInvitation = async () => {
      if (!user || loading || processingInvitation) return;
      
      if (PostAuthInvitationService.hasPendingInvitation()) {
        console.log('🎯 [DASHBOARD] Processing pending invitation...');
        setProcessingInvitation(true);
        
        try {
          const result = await PostAuthInvitationService.processPendingInvitation();
          
          if (result.success) {
            if (result.message) {
              toast.success(result.message);
            }
            if (result.redirectPath && result.redirectPath !== '/dashboard') {
              console.log('🎯 [DASHBOARD] Redirecting to:', result.redirectPath);
              setTimeout(() => {
                navigate(result.redirectPath!);
              }, 1500); // Give user time to see the success message
              return; // Don't continue with normal dashboard logic
            }
          } else if (result.error) {
            toast.error(result.error);
            if (result.redirectPath) {
              navigate(result.redirectPath);
            }
          }
        } catch (error) {
          console.error('❌ [DASHBOARD] Error processing invitation:', error);
          toast.error('Failed to process invitation');
        } finally {
          setProcessingInvitation(false);
        }
      }
    };

    processPendingInvitation();
  }, [user, loading, navigate, processingInvitation]);

  if (loading || processingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">
            {processingInvitation ? 'Processing your invitation...' : 'Loading...'}
          </div>
          {processingInvitation && (
            <div className="text-sm text-muted-foreground mt-2">
              Setting up your access...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Get available roles from user
  const roles = user.roles || [];
  console.log('🎯 [DASHBOARD] Available roles:', roles);
  console.log('🎯 [DASHBOARD] Selected role:', selectedRole);

  // Wait for role selection to be initialized
  if (!selectedRole && roles.length > 0) {
    console.log('🎯 [DASHBOARD] Waiting for role selection initialization...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg font-medium">Initializing...</div>
      </div>
    );
  }

  // Use selectedRole for routing - this is now purely driven by user selection
  const effectiveRole = selectedRole;
  console.log('🎯 [DASHBOARD] Effective role for routing:', effectiveRole);

  // Role-based dashboard routing - purely driven by selected role
  if (effectiveRole === 'brokerage_owner') {
    // Check if user has a brokerage_id in their profile
    if (user.brokerageId) {
      return <Navigate to={`/brokerage/${user.brokerageId}`} replace />;
    } else {
      // Handle case where brokerage owner doesn't have a brokerageId
      console.error('❌ [DASHBOARD] Brokerage owner missing brokerageId:', user.email);
      toast.error('Brokerage configuration missing. Please contact support.');
      // Fallback to default dashboard for now
    }
  }

  if (effectiveRole === 'real_estate_agent') {
    return <Navigate to="/agent/dashboard" replace />;
  }

  if (effectiveRole === 'broker_assistant') {
    return <Navigate to="/dashboard/broker-assistant" replace />;
  }

  // For simulation_collaborator or mortgage_applicant, show appropriate dashboard
  if (effectiveRole === 'simulation_collaborator') {
    return <SimulationCollaboratorDashboard />;
  }

  if (effectiveRole === 'mortgage_applicant') {
    return <MortgageApplicantDashboard />;
  }

  // Default dashboard for users without specific roles or fallback
  return (
    <MainLayout title="Dashboard" userEmail={user.email}>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Welcome to GoMutuo</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PendingInvitationsWidget />
          <AccessibleBrokerages />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
