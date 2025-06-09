
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleBasedRoute from '@/components/auth/RoleBasedRoute';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';

// Page imports
import Index from '@/pages/Index';
import AuthPage from '@/pages/Auth/AuthPage';
import Dashboard from '@/pages/Dashboard/Dashboard';
import AdminDashboard from '@/pages/Admin/AdminDashboard';
import BrokerageDashboard from '@/pages/Brokerage/BrokerageDashboard';
import BrokerageOwnerDashboard from '@/pages/Brokerage/BrokerageOwnerDashboard';
import ProjectDashboard from '@/pages/Project/ProjectDashboard';
import ProjectMembersDashboard from '@/pages/Project/ProjectMembersDashboard';
import ProjectDocuments from '@/pages/Project/ProjectDocuments';
import InvitePage from '@/pages/Invite/InvitePage';
import InviteJoinPage from '@/pages/Invite/InviteJoinPage';
import VerificationCallback from '@/pages/Invite/VerificationCallback';
import VerificationCallbackPage from '@/pages/Invite/VerificationCallbackPage';
import NotFound from '@/pages/NotFound';

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
      <ProtectedRoute>
        <RoleBasedRoute allowedRoles={['superadmin']}>
          <AdminDashboard />
        </RoleBasedRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/brokerage/:brokerageId',
    element: (
      <ProtectedRoute>
        <BrokerageDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/brokerage-owner/:brokerageId',
    element: (
      <ProtectedRoute>
        <RoleBasedRoute allowedRoles={['brokerage_owner', 'superadmin']}>
          <BrokerageOwnerDashboard />
        </RoleBasedRoute>
      </ProtectedRoute>
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
    path: '/project/:projectId/invite',
    element: (
      <ProtectedRoute>
        <InvitePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/invite/join/:token',
    element: <InviteJoinPage />,
  },
  {
    path: '/invite/verify/:token',
    element: <VerificationCallbackPage />,
  },
  {
    path: '/auth/callback',
    element: <VerificationCallback />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

const AppRouter = () => {
  return (
    <AuthProvider>
      <AuthErrorBoundary>
        <RouterProvider router={router} />
      </AuthErrorBoundary>
    </AuthProvider>
  );
};

export default AppRouter;
