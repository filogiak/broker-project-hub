import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleBasedRoute from '@/components/auth/RoleBasedRoute';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';

// Import pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard/Dashboard';
import Login from '@/pages/Login/Login';
import AuthPage from '@/pages/Auth/AuthPage';
import NotFound from '@/pages/NotFound';

// Admin pages
import AdminDashboard from '@/pages/Admin/AdminDashboard';

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
import BrokerDashboard from '@/pages/Broker/BrokerDashboard';
import BrokerProjectList from '@/pages/Broker/BrokerProjectList';

// Agent pages
import AgentPortal from '@/pages/Agent/AgentPortal';

// Client pages
import ClientPortal from '@/pages/Client/ClientPortal';

// Tenant pages
import TenantDashboard from '@/pages/Tenant/TenantDashboard';
import TenantSettings from '@/pages/Tenant/TenantSettings';

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
        <RoleBasedRoute allowedRoles={['brokerage_owner', 'superadmin']}>
          <BrokerageOwnerDashboard />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/brokerage/:brokerageId/projects',
      element: (
        <RoleBasedRoute allowedRoles={['brokerage_owner', 'superadmin']}>
          <BrokerageProjects />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/brokerage/:brokerageId/simulations',
      element: (
        <RoleBasedRoute allowedRoles={['brokerage_owner', 'superadmin', 'simulation_collaborator']}>
          <BrokerageSimulations />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/brokerage/:brokerageId/users',
      element: (
        <RoleBasedRoute allowedRoles={['brokerage_owner', 'superadmin']}>
          <BrokerageUsers />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/brokerage/:brokerageId/settings',
      element: (
        <RoleBasedRoute allowedRoles={['brokerage_owner', 'superadmin']}>
          <BrokerageSettings />
        </RoleBasedRoute>
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
        <RoleBasedRoute allowedRoles={['tenant']}>
          <TenantDashboard />
        </RoleBasedRoute>
      ),
    },
    {
      path: '/tenant/settings',
      element: (
        <RoleBasedRoute allowedRoles={['tenant']}>
          <TenantSettings />
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
