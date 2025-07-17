
import React from 'react';
import { RealEstateAgentLayout } from '@/components/agent/RealEstateAgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';

const AgentOrganizations = () => {
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
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessuna organizzazione trovata</h3>
              <p className="text-muted-foreground">
                Non sei ancora membro di nessuna brokerage. Contatta il tuo broker per ricevere un invito.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RealEstateAgentLayout>
  );
};

export default AgentOrganizations;
