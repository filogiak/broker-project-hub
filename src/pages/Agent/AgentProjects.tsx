
import React from 'react';
import { RealEstateAgentLayout } from '@/components/agent/RealEstateAgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

const AgentProjects = () => {
  return (
    <RealEstateAgentLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Progetti</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              I tuoi Progetti
            </CardTitle>
            <CardDescription>
              Tutti i progetti a cui hai accesso attraverso le tue organizzazioni o inviti diretti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessun progetto trovato</h3>
              <p className="text-muted-foreground">
                Non hai ancora accesso a nessun progetto. I progetti appariranno qui quando sarai invitato o quando farai parte di una brokerage.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RealEstateAgentLayout>
  );
};

export default AgentProjects;
