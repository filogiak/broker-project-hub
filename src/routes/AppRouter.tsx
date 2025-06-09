import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleBasedRoute from '@/components/auth/RoleBasedRoute';

// Auth pages
import AuthPage from '@/pages/Auth/AuthPage';
import InvitePage from '@/pages/Invite/InvitePage';
import VerificationCallback from '@/pages/Invite/VerificationCallback';

// Dashboard pages
import Dashboard from '@/pages/Dashboard/Dashboard';
import BrokerageOwnerDashboard from '@/pages/Brokerage/BrokerageOwnerDashboard';

// Admin pages
import AdminDashboard from '@/pages/Admin/AdminDashboard';

// Project pages
import ProjectDashboard from '@/pages/Project/ProjectDashboard';
import ProjectMembersDashboard from '@/pages/Project/ProjectMembersDashboard';
import ProjectDocuments from '@/pages/Project/ProjectDocuments';

// Other pages
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthErrorBoundary>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/invite" element={<InvitePage />} />
            <Route path="/invite/verify" element={<VerificationCallback />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['superadmin']}>
                  <AdminDashboard />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />

            {/* Brokerage owner routes */}
            <Route path="/brokerage/:brokerageId?" element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['brokerage_owner', 'superadmin']}>
                  <BrokerageOwnerDashboard />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />

            {/* Project routes */}
            <Route path="/project/:projectId" element={
              <ProtectedRoute>
                <ProjectDashboard />
              </ProtectedRoute>
            } />

            <Route path="/project/:projectId/members" element={
              <ProtectedRoute>
                <ProjectMembersDashboard />
              </ProtectedRoute>
            } />

            <Route path="/project/:projectId/documents" element={
              <ProtectedRoute>
                <ProjectDocuments />
              </ProtectedRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
