
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

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/invite" element={<InvitePage />} />
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
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
