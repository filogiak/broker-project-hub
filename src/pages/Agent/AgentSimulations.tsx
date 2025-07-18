
import React from 'react';
import { BarChart3, Plus } from 'lucide-react';
import { useAgentData } from '@/hooks/useAgentData';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import AgentSimulationCard from '@/components/agent/AgentSimulationCard';
import StandardCard from '@/components/ui/standard-card';
import ContentContainer from '@/components/ui/content-container';

const AgentSimulations = () => {
  // Apply role filter for real_estate_agent to show only relevant simulations
  const { simulations, loading, error, refreshSimulations, hasData } = useAgentData('real_estate_agent');

  const LoadingSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <Skeleton className="w-16 h-6 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-black font-dm-sans text-3xl font-bold">Simulazioni</h1>
          <Button 
            onClick={refreshSimulations}
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>
        
        {error && (
          <StandardCard title="Errore" icon={BarChart3}>
            <div className="flex items-center gap-2 text-red-500">
              <span>Errore nel caricamento delle simulazioni: {error}</span>
            </div>
          </StandardCard>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : simulations.length > 0 ? (
          <div className="space-y-6">
            <ContentContainer className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#235c4e]/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-[#235c4e]" />
                </div>
                <div>
                  <h2 className="text-black font-dm-sans text-lg font-semibold">
                    Le tue Simulazioni come Agente ({simulations.length})
                  </h2>
                  <p className="text-gray-600 font-dm-sans text-sm">
                    Simulazioni dove hai il ruolo di agente immobiliare
                  </p>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {simulations.map((simulation) => (
                  <AgentSimulationCard key={simulation.id} simulation={simulation} />
                ))}
              </div>
            </ContentContainer>
          </div>
        ) : (
          <ContentContainer className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#235c4e]/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#235c4e]" />
              </div>
              <div>
                <h2 className="text-black font-dm-sans text-lg font-semibold">
                  Le tue Simulazioni come Agente
                </h2>
                <p className="text-gray-600 font-dm-sans text-sm">
                  Simulazioni dove hai il ruolo di agente immobiliare
                </p>
              </div>
            </div>
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-black font-dm-sans text-lg font-medium mb-2">Nessuna simulazione trovata</h3>
              <p className="text-gray-600 font-dm-sans text-sm">
                Non hai simulazioni dove ricopri il ruolo di agente immobiliare. Le simulazioni dove sei collaboratore sono visibili dalla dashboard dedicata.
              </p>
            </div>
          </ContentContainer>
        )}
      </div>
    );
  };

export default AgentSimulations;
