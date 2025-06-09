
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleBasedRoute from '@/components/auth/RoleBasedRoute';
import MainLayout from '@/components/layout/MainLayout';

// Page imports
import Index from '@/pages/Index';
import AuthPage from '@/pages/Auth/AuthPage';
import Dashboard from '@/pages/Dashboard/Dashboard';
import AdminDashboard from '@/pages/Admin/AdminDashboard';
import BrokerageDashboard from '@/pages/Brokerage/BrokerageDashboard';
import BrokerageOwnerDashboard from '@/pages/Brokerage/BrokerageOwnerDashboard';
import BrokerDashboard from '@/pages/Broker/BrokerDashboard';
import BrokerProjectList from '@/pages/Broker/BrokerProjectList';
import AgentPortal from '@/pages/Agent/AgentPortal';
import ClientPortal from '@/pages/Client/ClientPortal';
import TenantDashboard from '@/pages/Tenant/TenantDashboard';
import TenantSettings from '@/pages/Tenant/TenantSettings';
import ProjectDashboard from '@/pages/Project/ProjectDashboard';
import ProjectMembersDashboard from '@/pages/Project/ProjectMembersDashboard';
import ProjectDocuments from '@/pages/Project/ProjectDocuments';
import InvitePage from '@/pages/Invite/InvitePage';
import JoinPage from '@/pages/Invite/JoinPage';
import VerificationCallback from '@/pages/Invite/VerificationCallback';
import NotFound from '@/pages/NotFound';

const AppRouter = () => {
  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/invite" element={<InvitePage />} />
            <Route path="/invite/join/:token" element={<JoinPage />} />
            <Route path="/invite/verify" element={<VerificationCallback />} />

            {/* Protected routes with layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <RoleBasedRoute allowedRoles={['superadmin']}>
                  <AdminDashboard />
                </RoleBasedRoute>
              }
            />

            {/* Brokerage routes */}
            <Route
              path="/brokerage/:id"
              element={
                <RoleBasedRoute allowedRoles={['superadmin', 'brokerage_owner']}>
                  <BrokerageDashboard />
                </RoleBasedRoute>
              }
            />

            <Route
              path="/brokerage-owner"
              element={
                <RoleBasedRoute allowedRoles={['brokerage_owner']}>
                  <BrokerageOwnerDashboard />
                </RoleBasedRoute>
              }
            />

            {/* Broker routes */}
            <Route
              path="/broker"
              element={
                <RoleBasedRoute allowedRoles={['broker_assistant']}>
                  <BrokerDashboard />
                </RoleBasedRoute>
              }
            />

            <Route
              path="/broker/projects"
              element={
                <RoleBasedRoute allowedRoles={['broker_assistant']}>
                  <BrokerProjectList />
                </RoleBasedRoute>
              }
            />

            {/* Agent routes */}
            <Route
              path="/agent"
              element={
                <RoleBasedRoute allowedRoles={['real_estate_agent']}>
                  <AgentPortal />
                </RoleBasedRoute>
              }
            />

            {/* Client routes */}
            <Route
              path="/client"
              element={
                <RoleBasedRoute allowedRoles={['mortgage_applicant']}>
                  <ClientPortal />
                </RoleBasedRoute>
              }
            />

            {/* Tenant routes */}
            <Route
              path="/tenant"
              element={
                <RoleBasedRoute allowedRoles={['superadmin', 'brokerage_owner']}>
                  <TenantDashboard />
                </RoleBasedRoute>
              }
            />

            <Route
              path="/tenant/settings"
              element={
                <RoleBasedRoute allowedRoles={['superadmin', 'brokerage_owner']}>
                  <TenantSettings />
                </RoleBasedRoute>
              }
            />

            {/* Project routes */}
            <Route
              path="/project/:id"
              element={
                <ProtectedRoute>
                  <ProjectDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/project/:id/members"
              element={
                <ProtectedRoute>
                  <ProjectMembersDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/project/:id/documents"
              element={
                <ProtectedRoute>
                  <ProjectDocuments />
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </AuthErrorBoundary>
  );
};

export default AppRouter;
