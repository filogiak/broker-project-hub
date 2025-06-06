
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

// Import placeholder components
import Login from '../pages/Login/Login';
import TenantDashboard from '../pages/Tenant/TenantDashboard';
import BrokerDashboard from '../pages/Broker/BrokerDashboard';
import ProjectDashboard from '../pages/Project/ProjectDashboard';
import ClientPortal from '../pages/Client/ClientPortal';
import AgentPortal from '../pages/Agent/AgentPortal';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Tenant routes */}
        <Route path="/tenant" element={<TenantDashboard />} />
        <Route path="/tenant/:tenantId" element={<TenantDashboard />} />
        
        {/* Broker routes */}
        <Route path="/broker" element={<BrokerDashboard />} />
        <Route path="/broker/:brokerId" element={<BrokerDashboard />} />
        
        {/* Project routes */}
        <Route path="/project/:id" element={<ProjectDashboard />} />
        
        {/* Client portal routes */}
        <Route path="/client/:projectId" element={<ClientPortal />} />
        
        {/* Agent portal routes */}
        <Route path="/agent/:projectId" element={<AgentPortal />} />
        
        {/* Default route */}
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
