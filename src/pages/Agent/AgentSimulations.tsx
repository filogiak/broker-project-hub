
import React from 'react';
import { RealEstateAgentLayout } from '@/components/agent/RealEstateAgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const AgentSimulations = () => {
  return (
    <RealEstateAgentLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Simulazioni</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Le tue Simulazioni
            </CardTitle>
            <CardDescription>
              Simulazioni che hai creato o a cui hai accesso attraverso le tue organizzazioni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessuna simulazione trovata</h3>
              <p className="text-muted-foreground">
                Non hai ancora creato nessuna simulazione. Potrai creare simulazioni quando farai parte di una brokerage.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RealEstateAgentLayout>
  );
};

export default AgentSimulations;
