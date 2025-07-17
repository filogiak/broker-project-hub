
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const AgentSettings = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Impostazioni</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Impostazioni Agente
            </CardTitle>
            <CardDescription>
              Configura le tue preferenze e impostazioni personali
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Impostazioni in sviluppo</h3>
              <p className="text-muted-foreground">
                Le opzioni di configurazione saranno disponibili presto.
              </p>
            </div>
          </CardContent>
      </Card>
    </div>
  );
};

export default AgentSettings;
