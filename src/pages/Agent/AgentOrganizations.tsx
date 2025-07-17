
import React from 'react';
import { RealEstateAgentLayout } from '@/components/agent/RealEstateAgentLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, AlertCircle } from 'lucide-react';
import { useAgentData } from '@/hooks/useAgentData';
import AgentOrganizationCard from '@/components/agent/AgentOrganizationCard';
import StandardCard from '@/components/ui/standard-card';

const AgentOrganizations = () => {
  const { creatableBrokerages, loading, error } = useAgentData();

  return (
    <RealEstateAgentLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-black font-dm-sans text-3xl font-bold">Organizzazioni</h1>
        </div>
        
        <StandardCard 
          title="Le tue Organizzazioni" 
          description="Elenco delle brokerages di cui fai parte come agente immobiliare"
          icon={Building}
        >
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-6 border border-gray-100 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <Skeleton className="w-20 h-6 rounded" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="w-3/4 h-6" />
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-1/2 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-black font-dm-sans text-lg font-medium mb-2">Errore nel caricamento</h3>
              <p className="text-gray-600 font-dm-sans text-sm">
                Si è verificato un errore nel caricamento delle organizzazioni: {error}
              </p>
            </div>
          )}

          {!loading && !error && creatableBrokerages.length === 0 && (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-black font-dm-sans text-lg font-medium mb-2">Nessuna organizzazione trovata</h3>
              <p className="text-gray-600 font-dm-sans text-sm">
                Non sei ancora membro di nessuna brokerage. Contatta il tuo broker per ricevere un invito.
              </p>
            </div>
          )}

          {!loading && !error && creatableBrokerages.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {creatableBrokerages.map((brokerage) => (
                <AgentOrganizationCard 
                  key={brokerage.id} 
                  brokerage={brokerage} 
                />
              ))}
            </div>
          )}
        </StandardCard>
      </div>
    </RealEstateAgentLayout>
  );
};

export default AgentOrganizations;
