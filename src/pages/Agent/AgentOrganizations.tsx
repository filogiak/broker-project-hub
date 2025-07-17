
import React from 'react';
import { RealEstateAgentLayout } from '@/components/agent/RealEstateAgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, AlertCircle } from 'lucide-react';
import { useAgentData } from '@/hooks/useAgentData';
import AgentOrganizationCard from '@/components/agent/AgentOrganizationCard';

const AgentOrganizations = () => {
  const { creatableBrokerages, loading, error } = useAgentData();

  return (
    <RealEstateAgentLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Organizzazioni</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Le tue Organizzazioni
            </CardTitle>
            <CardDescription>
              Elenco delle brokerages di cui fai parte come agente immobiliare
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-6 border rounded-lg">
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
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Errore nel caricamento</h3>
                <p className="text-muted-foreground">
                  Si è verificato un errore nel caricamento delle organizzazioni: {error}
                </p>
              </div>
            )}

            {!loading && !error && creatableBrokerages.length === 0 && (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nessuna organizzazione trovata</h3>
                <p className="text-muted-foreground">
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
          </CardContent>
        </Card>
      </div>
    </RealEstateAgentLayout>
  );
};

export default AgentOrganizations;
