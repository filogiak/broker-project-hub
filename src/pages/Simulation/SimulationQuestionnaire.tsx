
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import SimulationSidebar from '@/components/simulation/SimulationSidebar';
import SimulationHeaderCard from '@/components/simulation/SimulationHeaderCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { useSimulationData } from '@/hooks/useSimulationData';
import { useSimulationParticipants } from '@/hooks/useSimulationParticipants';
import { useFormLink } from '@/hooks/useFormLink';
import { useAuth } from '@/hooks/useAuth';
import QuestionnaireBox from '@/components/simulation/QuestionnaireBox';
import { useToast } from '@/hooks/use-toast';

const SimulationQuestionnaire = () => {
  const { simulationId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: simulation, isLoading, error } = useSimulationData(simulationId || '');
  const { data: participants, isLoading: participantsLoading } = useSimulationParticipants(simulationId || '');
  const formLinkMutation = useFormLink();

  if (!simulationId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleQuestionnaireClick = async (name: string, email: string, phone: string, formSlug: string) => {
    try {
      const formLink = await formLinkMutation.mutateAsync({
        name,
        email,
        phone,
        formSlug,
      });
      
      // Open the form in a new window
      window.open(formLink, '_blank');
    } catch (error) {
      console.error('Failed to open questionnaire:', error);
    }
  };

  const renderQuestionnaireBoxes = () => {
    if (!simulation || !participants) return null;

    const applicantCount = simulation.applicant_count;
    const boxes = [];

    // Always show Project box
    const projectParticipant = participants.find(p => p.participant_designation === 'applicant_one') || 
                               participants.find(p => p.participant_designation === 'solo_applicant');
    
    if (projectParticipant) {
      boxes.push(
        <QuestionnaireBox
          key="progetto"
          title="Progetto"
          description="Informazioni generali sul progetto mutuo"
          onClick={() => handleQuestionnaireClick(
            `${projectParticipant.first_name} ${projectParticipant.last_name}`,
            projectParticipant.email,
            projectParticipant.phone || '',
            'gestionale-progetto'
          )}
          loading={formLinkMutation.isPending}
        />
      );
    }

    if (applicantCount === 'one_applicant') {
      // One applicant: show "Domande sul Richiedente"
      const applicant = participants.find(p => p.participant_designation === 'solo_applicant');
      if (applicant) {
        boxes.push(
          <QuestionnaireBox
            key="richiedente"
            title="Domande sul Richiedente"
            description="Questionario per il richiedente principale"
            onClick={() => handleQuestionnaireClick(
              `${applicant.first_name} ${applicant.last_name}`,
              applicant.email,
              applicant.phone || '',
              'gestionale-intestatario'
            )}
            loading={formLinkMutation.isPending}
          />
        );
      }
    } else {
      // Two applicants: show "Domande Richiedente 1" and "Domande Richiedente 2"
      const applicant1 = participants.find(p => p.participant_designation === 'applicant_one');
      const applicant2 = participants.find(p => p.participant_designation === 'applicant_two');

      if (applicant1) {
        boxes.push(
          <QuestionnaireBox
            key="richiedente1"
            title="Domande Richiedente 1"
            description="Questionario per il primo richiedente"
            onClick={() => handleQuestionnaireClick(
              `${applicant1.first_name} ${applicant1.last_name}`,
              applicant1.email,
              applicant1.phone || '',
              'gestionale-intestatario'
            )}
            loading={formLinkMutation.isPending}
          />
        );
      }

      if (applicant2) {
        boxes.push(
          <QuestionnaireBox
            key="richiedente2"
            title="Domande Richiedente 2"
            description="Questionario per il secondo richiedente"
            onClick={() => handleQuestionnaireClick(
              `${applicant2.first_name} ${applicant2.last_name}`,
              applicant2.email,
              applicant2.phone || '',
              'gestionale-intestatario'
            )}
            loading={formLinkMutation.isPending}
          />
        );
      }
    }

    return boxes;
  };

  if (isLoading || participantsLoading) {
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SimulationSidebar />
        <SidebarInset>
          <div className="flex-1 p-8 space-y-8">
            <SimulationHeaderCard simulation={simulation} />

            {/* Questionnaire Section */}
            <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
              <CardHeader>
                <CardTitle className="font-dm-sans text-xl text-black">
                  Questionario Simulazione
                </CardTitle>
                <CardDescription className="font-dm-sans">
                  Compila i questionari per configurare la tua simulazione mutuo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {participants && participants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderQuestionnaireBoxes()}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">
                      Nessun partecipante trovato per questa simulazione.
                      Assicurati che i partecipanti siano stati configurati correttamente.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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

          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SimulationQuestionnaire;
