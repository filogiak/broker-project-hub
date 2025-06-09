
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleBasedRoute from '@/components/auth/RoleBasedRoute';
import BrokerageOwnerDashboard from '@/pages/Brokerage/BrokerageOwnerDashboard';
import AdminDashboard from '@/pages/Admin/AdminDashboard';
import AuthPage from '@/pages/Auth/AuthPage';
import ProjectDashboard from '@/pages/Project/ProjectDashboard';
import ProjectMembersDashboard from '@/pages/Project/ProjectMembersDashboard';
import InvitePage from '@/pages/Invite/InvitePage';
import Dashboard from '@/pages/Dashboard/Dashboard';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/brokerage/:brokerageId" 
          element={
            <ProtectedRoute>
              <BrokerageOwnerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['superadmin']}>
                <AdminDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/project/:projectId" 
          element={
            <ProtectedRoute>
              <ProjectDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/project/:projectId/members" 
          element={
            <ProtectedRoute>
              <ProjectMembersDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
