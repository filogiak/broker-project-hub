import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RoleAwareLayout } from '@/components/layout/RoleAwareLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleBasedRoute from '@/components/auth/RoleBasedRoute';
import BrokerageAccessRoute from '@/components/auth/BrokerageAccessRoute';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';

// Import pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard/Dashboard';
import Login from '@/pages/Login/Login';
import AuthPage from '@/pages/Auth/AuthPage';
import NotFound from '@/pages/NotFound';

// Admin pages
import AdminDashboard from '@/pages/Admin/AdminDashboard';

// Role-specific dashboard pages
import SimulationCollaboratorDashboard from '@/pages/Dashboard/SimulationCollaboratorDashboard';
import MortgageApplicantDashboard from '@/pages/Dashboard/MortgageApplicantDashboard';
import BrokerAssistantDashboard from '@/pages/Dashboard/BrokerAssistantDashboard';

// Brokerage pages
import BrokerageOwnerDashboard from '@/pages/Brokerage/BrokerageOwnerDashboard';
import BrokerageProjects from '@/pages/Brokerage/BrokerageProjects';
import BrokerageSimulations from '@/pages/Brokerage/BrokerageSimulations';
import BrokerageUsers from '@/pages/Brokerage/BrokerageUsers';
import BrokerageSettings from '@/pages/Brokerage/BrokerageSettings';

// Project pages
import ProjectDashboard from '@/pages/Project/ProjectDashboard';
import ProjectMembersDashboard from '@/pages/Project/ProjectMembersDashboard';
import ProjectDocuments from '@/pages/Project/ProjectDocuments';
import ProjectSettings from '@/pages/Project/ProjectSettings';

// Invitation pages
import InvitePage from '@/pages/Invite/InvitePage';
import InviteJoinPage from '@/pages/Invite/InviteJoinPage';
import VerificationCallback from '@/pages/Invite/VerificationCallback';

// Broker pages
import BrokerDashboard from '@/pages/Broker/BrokerProjectList';
import BrokerProjectList from '@/pages/Broker/BrokerProjectList';

// Agent pages
import AgentPortal from '@/pages/Agent/AgentPortal';

// Client pages
import ClientPortal from '@/pages/Client/ClientPortal';

// Tenant pages
import TenantDashboard from '@/pages/Tenant/TenantDashboard';
import TenantSettings from '@/pages/Tenant/TenantSettings';

// Import simulation pages
import SimulationDashboard from '@/pages/Simulation/SimulationDashboard';
import SimulationQuestionnaire from '@/pages/Simulation/SimulationQuestionnaire';
import SimulationMembers from '@/pages/Simulation/SimulationMembers';
import SimulationSettings from '@/pages/Simulation/SimulationSettings';

// Import broker assistant pages
import BrokerAssistantInvitations from '@/pages/BrokerAssistant/BrokerAssistantInvitations';
import BrokerAssistantSettings from '@/pages/BrokerAssistant/BrokerAssistantSettings';
import BrokerAssistantOrganizations from '@/pages/BrokerAssistant/BrokerAssistantOrganizations';
import { BrokerAssistantLayout } from '@/components/broker/BrokerAssistantLayout';
import { RealEstateAgentLayout } from '@/components/agent/RealEstateAgentLayout';

// Import new agent pages
import AgentDashboard from '@/pages/Agent/AgentDashboard';
import AgentOrganizations from '@/pages/Agent/AgentOrganizations';
import AgentProjects from '@/pages/Agent/AgentProjects';
import AgentSimulations from '@/pages/Agent/AgentSimulations';
import AgentSettings from '@/pages/Agent/AgentSettings';
import AgentInvitations from '@/pages/Agent/AgentInvitations';

const AppRouter = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Index />,
    },
    {
      path: '/auth',
      element: <AuthPage />,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute>
          <RoleAwareLayout>
            <Dashboard />
          </RoleAwareLayout>
        </ProtectedRoute>
      ),
    },
    // Role-specific dashboard routes - Wrapped with RoleAwareLayout to provide context
    {
      path: '/dashboard/simulation-collaborator',
      element: (
        <RoleAwareLayout>
          <RoleBasedRoute allowedRoles={['simulation_collaborator']}>
            <SimulationCollaboratorDashboard />
          </RoleBasedRoute>
        </RoleAwareLayout>
      ),
    },
    {
      path: '/dashboard/real-estate-agent',
      element: (
        <RoleAwareLayout>
          <RoleBasedRoute allowedRoles={['real_estate_agent']}>
            <RealEstateAgentLayout>
              <AgentDashboard />
            </RealEstateAgentLayout>
          </RoleBasedRoute>
        </RoleAwareLayout>
      ),
    },
    {
      path: '/dashboard/broker-assistant',
      element: (
        <RoleAwareLayout>
          <RoleBasedRoute allowedRoles={['broker_assistant']}>
            <BrokerAssistantDashboard />
          </RoleBasedRoute>
        </RoleAwareLayout>
      ),
    },
    {
      path: '/dashboard/broker-assistant/invitations',
      element: (
        <RoleAwareLayout>
          <RoleBasedRoute allowedRoles={['broker_assistant']}>
            <BrokerAssistantLayout>
              <BrokerAssistantInvitations />
            </BrokerAssistantLayout>
          </RoleBasedRoute>
        </RoleAwareLayout>
      ),
    },
    {
      path: '/dashboard/broker-assistant/settings',
      element: (
        <RoleAwareLayout>
          <RoleBasedRoute allowedRoles={['broker_assistant']}>
            <BrokerAssistantLayout>
              <BrokerAssistantSettings />
            </BrokerAssistantLayout>
          </RoleBasedRoute>
        </RoleAwareLayout>
      ),
    },
    {
      path: '/dashboard/mortgage-applicant',
      element: (
        <RoleBasedRoute allowedRoles={['mortgage_applicant']}>
          <MortgageApplicantDashboard />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/admin',
      element: (
        <RoleBasedRoute allowedRoles={['superadmin']}>
          <AdminDashboard />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/brokerage/:brokerageId',
      element: (
        <BrokerageAccessRoute>
          <BrokerageOwnerDashboard />
        </BrokerageAccessRoute>
      ),
    },
    {
      path: '/brokerage/:brokerageId/projects',
      element: (
        <BrokerageAccessRoute>
          <BrokerageProjects />
        </BrokerageAccessRoute>
      ),
    },
    {
      path: '/brokerage/:brokerageId/simulations',
      element: (
        <BrokerageAccessRoute>
          <BrokerageSimulations />
        </BrokerageAccessRoute>
      ),
    },
    {
      path: '/brokerage/:brokerageId/users',
      element: (
        <BrokerageAccessRoute>
          <BrokerageUsers />
        </BrokerageAccessRoute>
      ),
    },
    {
      path: '/brokerage/:brokerageId/settings',
      element: (
        <BrokerageAccessRoute>
          <BrokerageSettings />
        </BrokerageAccessRoute>
      ),
    },
    {
      path: '/project/:projectId',
      element: (
        <ProtectedRoute>
          <ProjectDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/project/:projectId/members',
      element: (
        <ProtectedRoute>
          <ProjectMembersDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/project/:projectId/documents',
      element: (
        <ProtectedRoute>
          <ProjectDocuments />
        </ProtectedRoute>
      ),
    },
    {
      path: '/project/:projectId/settings',
      element: (
        <ProtectedRoute>
          <ProjectSettings />
        </ProtectedRoute>
      ),
    },
    {
      path: '/invite/:token',
      element: <InvitePage />,
    },
    {
      path: '/join/:token',
      element: <InviteJoinPage />,
    },
    {
      path: '/auth/callback',
      element: <VerificationCallback />,
    },
    {
      path: '/broker',
      element: (
        <RoleBasedRoute allowedRoles={['broker_assistant']}>
          <BrokerDashboard />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/broker/projects',
      element: (
        <RoleBasedRoute allowedRoles={['broker_assistant']}>
          <BrokerProjectList />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/agent',
      element: (
        <RoleBasedRoute allowedRoles={['real_estate_agent']}>
          <AgentPortal />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/client',
      element: (
        <RoleBasedRoute allowedRoles={['mortgage_applicant']}>
          <ClientPortal />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/tenant',
      element: (
        <ProtectedRoute>
          <TenantDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/tenant/settings',
      element: (
        <ProtectedRoute>
          <TenantSettings />
        </ProtectedRoute>
      ),
    },
    {
      path: '/simulation/:simulationId',
      element: (
        <ProtectedRoute>
          <SimulationDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: '/simulation/:simulationId/questionnaire',
      element: (
        <ProtectedRoute>
          <SimulationQuestionnaire />
        </ProtectedRoute>
      ),
    },
    {
      path: '/simulation/:simulationId/members',
      element: (
        <ProtectedRoute>
          <SimulationMembers />
        </ProtectedRoute>
      ),
    },
    {
      path: '/simulation/:simulationId/settings',
      element: (
        <ProtectedRoute>
          <SimulationSettings />
        </ProtectedRoute>
      ),
    },
    
    {
      path: '/agent/dashboard',
      element: (
        <RoleAwareLayout>
          <RoleBasedRoute allowedRoles={['real_estate_agent']}>
            <RealEstateAgentLayout>
              <AgentDashboard />
            </RealEstateAgentLayout>
          </RoleBasedRoute>
        </RoleAwareLayout>
      ),
    },
    {
      path: '/agent/organizzazioni',
      element: (
        <RoleAwareLayout>
          <RoleBasedRoute allowedRoles={['real_estate_agent']}>
            <RealEstateAgentLayout>
              <AgentOrganizations />
            </RealEstateAgentLayout>
          </RoleBasedRoute>
        </RoleAwareLayout>
      ),
    },
    {
      path: '/agent/progetti',
      element: (
        <RoleAwareLayout>
          <RoleBasedRoute allowedRoles={['real_estate_agent']}>
            <RealEstateAgentLayout>
              <AgentProjects />
            </RealEstateAgentLayout>
          </RoleBasedRoute>
        </RoleAwareLayout>
      ),
    },
    {
      path: '/agent/simulazioni',
      element: (
        <RoleAwareLayout>
          <RoleBasedRoute allowedRoles={['real_estate_agent']}>
            <RealEstateAgentLayout>
              <AgentSimulations />
            </RealEstateAgentLayout>
          </RoleBasedRoute>
        </RoleAwareLayout>
      ),
    },
    {
      path: '/agent/inviti',
      element: (
        <RoleAwareLayout>
          <RoleBasedRoute allowedRoles={['real_estate_agent']}>
            <RealEstateAgentLayout>
              <AgentInvitations />
            </RealEstateAgentLayout>
          </RoleBasedRoute>
        </RoleAwareLayout>
      ),
    },
    {
      path: '/agent/impostazioni',
      element: (
        <RoleAwareLayout>
          <RoleBasedRoute allowedRoles={['real_estate_agent']}>
            <RealEstateAgentLayout>
              <AgentSettings />
            </RealEstateAgentLayout>
          </RoleBasedRoute>
        </RoleAwareLayout>
      ),
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ]);

  return (
    <AuthErrorBoundary>
      <RouterProvider router={router} />
    </AuthErrorBoundary>
  );
};

export default AppRouter;
