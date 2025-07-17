import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
import RealEstateAgentDashboard from '@/pages/Dashboard/RealEstateAgentDashboard';
import BrokerAssistantDashboard from '@/pages/Dashboard/BrokerAssistantDashboard';
import MortgageApplicantDashboard from '@/pages/Dashboard/MortgageApplicantDashboard';

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
import { BrokerAssistantLayout } from '@/components/broker/BrokerAssistantLayout';

// Import new agent pages
import AgentDashboard from '@/pages/Agent/AgentDashboard';
import AgentOrganizations from '@/pages/Agent/AgentOrganizations';
import AgentProjects from '@/pages/Agent/AgentProjects';
import AgentSimulations from '@/pages/Agent/AgentSimulations';
import AgentSettings from '@/pages/Agent/AgentSettings';

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
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    // Role-specific dashboard routes
    {
      path: '/dashboard/simulation-collaborator',
      element: (
        <RoleBasedRoute allowedRoles={['simulation_collaborator']}>
          <SimulationCollaboratorDashboard />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/dashboard/real-estate-agent',
      element: (
        <RoleBasedRoute allowedRoles={['real_estate_agent']}>
          <RealEstateAgentDashboard />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/dashboard/broker-assistant',
      element: (
        <RoleBasedRoute allowedRoles={['broker_assistant']}>
          <BrokerAssistantDashboard />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/dashboard/broker-assistant/invitations',
      element: (
        <RoleBasedRoute allowedRoles={['broker_assistant']}>
          <BrokerAssistantLayout>
            <BrokerAssistantInvitations />
          </BrokerAssistantLayout>
        </RoleBasedRoute>
      ),
    },
    {
      path: '/dashboard/broker-assistant/settings',
      element: (
        <RoleBasedRoute allowedRoles={['broker_assistant']}>
          <BrokerAssistantLayout>
            <BrokerAssistantSettings />
          </BrokerAssistantLayout>
        </RoleBasedRoute>
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
    
    // Real Estate Agent routes with new layout
    {
      path: '/agent/dashboard',
      element: (
        <RoleBasedRoute allowedRoles={['real_estate_agent']}>
          <AgentDashboard />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/agent/organizzazioni',
      element: (
        <RoleBasedRoute allowedRoles={['real_estate_agent']}>
          <AgentOrganizations />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/agent/progetti',
      element: (
        <RoleBasedRoute allowedRoles={['real_estate_agent']}>
          <AgentProjects />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/agent/simulazioni',
      element: (
        <RoleBasedRoute allowedRoles={['real_estate_agent']}>
          <AgentSimulations />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/agent/impostazioni',
      element: (
        <RoleBasedRoute allowedRoles={['real_estate_agent']}>
          <AgentSettings />
        </RoleBasedRoute>
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
