
import React from 'react';
import { useAgentData } from '@/hooks/useAgentData';
import { Card, CardContent } from '@/components/ui/card';
import { Building } from 'lucide-react';
import AgentOrganizationDisplayCard from '@/components/agent/AgentOrganizationDisplayCard';

const AgentOrganizations = () => {
  const { creatableBrokerages, loading, error } = useAgentData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Caricamento organizzazioni...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8">
      {/* Main Action Cards */}
      <div>
        <h2 className="font-semibold font-dm-sans mb-2 text-2xl text-black">Le tue Organizzazioni</h2>
        <p className="text-muted-foreground font-dm-sans mb-6">
          Organizzazioni di cui fai parte come agente immobiliare
        </p>
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-6">
        {!creatableBrokerages || creatableBrokerages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2 font-dm-sans">Nessuna organizzazione trovata</h3>
              <p className="text-muted-foreground text-center max-w-md font-dm-sans">
                Non sei ancora membro di nessuna organizzazione come agente immobiliare. 
                Attendi un invito dal proprietario di un'organizzazione.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatableBrokerages.map((brokerage) => (
              <AgentOrganizationDisplayCard
                key={brokerage.id}
                brokerage={brokerage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentOrganizations;
