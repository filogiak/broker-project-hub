
import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import SimulationSidebar from '@/components/simulation/SimulationSidebar';
import SimulationHeaderCard from '@/components/simulation/SimulationHeaderCard';
import SimulationSetupWizard from '@/components/simulation/SimulationSetupWizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Play, CheckCircle, Settings } from 'lucide-react';
import { useSimulationData } from '@/hooks/useSimulationData';
import { useAuth } from '@/hooks/useAuth';

const SimulationQuestionnaire = () => {
  const { simulationId } = useParams();
  const { user } = useAuth();
  const { data: simulation, isLoading, error, refetch } = useSimulationData(simulationId || '');
  const [showSetupWizard, setShowSetupWizard] = useState(false);

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
            <div className="flex-1 p-8">
              <div className="animate-pulse space-y-6">
                <div className="bg-white border border-[#BEB8AE] rounded-[12px] p-6">
                  <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-96"></div>
                </div>
              </div>
            </div>
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

  const isSetupComplete = simulation?.setup_completed_at !== null;

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    refetch();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SimulationSidebar />
        <SidebarInset>
          <div className="flex-1 p-8 space-y-8">
            <SimulationHeaderCard simulation={simulation} />

            {!isSetupComplete ? (
              // Setup Required Section
              <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
                <CardHeader>
                  <CardTitle className="font-dm-sans text-xl text-black">
                    Configurazione Simulazione
                  </CardTitle>
                  <CardDescription className="font-dm-sans">
                    Completa la configurazione per iniziare la tua simulazione mutuo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Settings className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl mb-2">Configurazione Richiesta</h3>
                    <p className="text-gray-600 mb-6">
                      Prima di poter utilizzare il questionario, è necessario configurare
                      la simulazione con i dati dei partecipanti.
                    </p>
                    <Button onClick={() => setShowSetupWizard(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configura Simulazione
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Questionnaire Section (when setup is complete)
              <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
                <CardHeader>
                  <CardTitle className="font-dm-sans text-xl text-black">
                    Questionario Simulazione
                  </CardTitle>
                  <CardDescription className="font-dm-sans">
                    Compila il questionario per configurare la tua simulazione mutuo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-form-green/10 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-form-green" />
                    </div>
                    <h3 className="font-semibold text-xl mb-2">Questionario Pronto</h3>
                    <p className="text-gray-600 mb-6">
                      La configurazione è completa. Ora puoi procedere con il questionario
                      per raccogliere i dati necessari per la simulazione.
                    </p>
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      Inizia Questionario
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Section */}
            <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
              <CardHeader>
                <CardTitle className="font-dm-sans text-xl text-black">
                  Progresso Simulazione
                </CardTitle>
                <CardDescription className="font-dm-sans">
                  Stato di completamento della simulazione
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">Dati anagrafici</span>
                    <span className="ml-auto text-sm text-gray-500">0%</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">Situazione economica</span>
                    <span className="ml-auto text-sm text-gray-500">0%</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">Immobile di interesse</span>
                    <span className="ml-auto text-sm text-gray-500">0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Setup Wizard */}
            {simulationId && (
              <SimulationSetupWizard
                isOpen={showSetupWizard}
                onClose={() => setShowSetupWizard(false)}
                simulationId={simulationId}
                simulationName={simulation?.name || 'Simulation'}
                onSetupComplete={handleSetupComplete}
              />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SimulationQuestionnaire;
