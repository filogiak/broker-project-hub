
import React from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleBasedRoute from '@/components/auth/RoleBasedRoute';

// Import components
import AuthPage from '@/pages/Auth/AuthPage';
import Dashboard from '@/pages/Dashboard/Dashboard';
import BrokerageDashboard from '@/pages/Brokerage/BrokerageDashboard';
import AdminDashboard from '@/pages/Admin/AdminDashboard';
import ProjectDashboard from '@/pages/Project/ProjectDashboard';
import ClientPortal from '@/pages/Client/ClientPortal';
import AgentPortal from '@/pages/Agent/AgentPortal';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Brokerage routes - for brokerage owners and assistants */}
        <Route 
          path="/brokerage/:brokerageId" 
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['superadmin', 'brokerage_owner', 'broker_assistant']}>
                <BrokerageDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes - superadmin only */}
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
        
        {/* Project routes - for project members */}
        <Route 
          path="/project/:id" 
          element={
            <ProtectedRoute>
              <ProjectDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Client portal routes - for applicants and agents */}
        <Route 
          path="/client/:projectId" 
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['mortgage_applicant', 'real_estate_agent', 'brokerage_owner', 'broker_assistant', 'superadmin']}>
                <ClientPortal />
              </RoleBasedRoute>
            </ProtectedRoute>
          } 
        />
        
        {/* Agent portal routes */}
        <Route 
          path="/agent/:projectId" 
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['real_estate_agent', 'broker_assistant', 'brokerage_owner', 'superadmin']}>
                <AgentPortal />
              </RoleBasedRoute>
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Legacy route redirects */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/broker" element={<Navigate to="/dashboard" replace />} />
        <Route path="/broker/:brokerId" element={<Navigate to="/dashboard" replace />} />
        <Route path="/tenant" element={<Navigate to="/dashboard" replace />} />
        <Route path="/tenant/:tenantId" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
