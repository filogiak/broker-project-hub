
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import SimulationSidebar from '@/components/simulation/SimulationSidebar';
import SimulationHeaderCard from '@/components/simulation/SimulationHeaderCard';
import { useSimulationData } from '@/hooks/useSimulationData';
import { useAuth } from '@/hooks/useAuth';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { PageLoader } from '@/components/ui/page-loader';

const SimulationDashboard = () => {
  const { simulationId } = useParams();
  const { user } = useAuth();
  const { data: simulation, isLoading, error } = useSimulationData(simulationId || '');

  if (!simulationId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <SimulationSidebar />
          <SidebarInset>
            <PageLoader message="Loading simulation..." />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !simulation) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <SimulationSidebar />
          <SidebarInset>
            <div className="flex-1 p-8">
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Simulazione non trovata
                </h2>
                <p className="text-gray-600">
                  La simulazione richiesta non esiste o non hai i permessi per visualizzarla.
                </p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Redirect to questionnaire by default
  return <Navigate to={`/simulation/${simulationId}/questionnaire`} replace />;
};

export default SimulationDashboard;
