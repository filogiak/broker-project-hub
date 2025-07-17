
import React from 'react';
import { RealEstateAgentLayout } from '@/components/agent/RealEstateAgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Users, Briefcase, BarChart3, Building } from 'lucide-react';

const AgentDashboard = () => {
  return (
    <RealEstateAgentLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard Agente</h2>
        </div>
        
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizzazioni</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Brokerages attive
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progetti Attivi</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                In gestione
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Simulazioni</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Disponibili
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clienti</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Attivi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Benvenuto nel tuo Dashboard Agente</CardTitle>
              <CardDescription>
                Gestisci i tuoi progetti, organizzazioni e simulazioni da un unico posto.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Da qui puoi accedere a tutte le tue attività di agente immobiliare:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-form-green" />
                    <span>Visualizza le organizzazioni di cui fai parte</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-form-green" />
                    <span>Gestisci i progetti a cui hai accesso</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-form-green" />
                    <span>Crea e gestisci simulazioni</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Attività Recenti</CardTitle>
              <CardDescription>
                Le tue ultime azioni sul sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nessuna attività recente da mostrare
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RealEstateAgentLayout>
  );
};

export default AgentDashboard;
