
import React from 'react';
import { RealEstateAgentLayout } from '@/components/agent/RealEstateAgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Users, Briefcase, BarChart3, Building, Mail } from 'lucide-react';
import { useAgentData } from '@/hooks/useAgentData';
import { Skeleton } from '@/components/ui/skeleton';

const AgentDashboard = () => {
  const { creatableBrokerages, stats, invitations, loading, error, hasInvitations } = useAgentData();

  const StatCard = ({ title, value, description, icon: Icon, isLoading }: {
    title: string;
    value: number | string;
    description: string;
    icon: React.ComponentType<any>;
    isLoading: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <RealEstateAgentLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard Agente</h2>
        </div>
        
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Organizzazioni"
            value={creatableBrokerages.length}
            description="Brokerages attive"
            icon={Home}
            isLoading={loading}
          />
          
          <StatCard
            title="Progetti Attivi"
            value={stats.totalProjects}
            description="In gestione"
            icon={Briefcase}
            isLoading={loading}
          />
          
          <StatCard
            title="Simulazioni"
            value={stats.totalSimulations}
            description="Disponibili"
            icon={BarChart3}
            isLoading={loading}
          />
          
          <StatCard
            title="Inviti"
            value={stats.pendingInvitations}
            description="In attesa"
            icon={Mail}
            isLoading={loading}
          />
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
              <CardTitle>Inviti in Attesa</CardTitle>
              <CardDescription>
                {hasInvitations ? 'I tuoi inviti pendenti' : 'Nessun invito pendente'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : hasInvitations ? (
                  <div className="space-y-3">
                    {invitations.slice(0, 3).map((invitation) => (
                      <div key={invitation.id} className="flex items-center gap-3 p-2 rounded-lg border">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {invitation.project_name || invitation.simulation_name || invitation.brokerage_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            da {invitation.inviter_name} • {invitation.days_remaining} giorni rimasti
                          </p>
                        </div>
                      </div>
                    ))}
                    {invitations.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{invitations.length - 3} altri inviti
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nessun invito in attesa
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RealEstateAgentLayout>
  );
};

export default AgentDashboard;
