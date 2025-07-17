import React from 'react';
import { RealEstateAgentLayout } from '@/components/agent/RealEstateAgentLayout';
import { Home, Users, Briefcase, BarChart3, Building, Mail, LucideIcon } from 'lucide-react';
import { useAgentData } from '@/hooks/useAgentData';
import { Skeleton } from '@/components/ui/skeleton';
import StandardCard from '@/components/ui/standard-card';

const AgentDashboard = () => {
  const { creatableBrokerages, stats, invitations, loading, error, hasInvitations } = useAgentData();

  const StatCard = ({ title, value, description, icon: Icon, isLoading }: {
    title: string;
    value: number | string;
    description: string;
    icon: LucideIcon;
    isLoading: boolean;
  }) => (
    <StandardCard title={title} icon={Icon}>
      {isLoading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <div className="text-3xl font-bold text-black font-dm-sans mb-1">{value}</div>
      )}
      <p className="text-gray-600 font-dm-sans text-sm">{description}</p>
    </StandardCard>
  );

  return (
    <RealEstateAgentLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-black font-dm-sans text-3xl font-bold">Dashboard Agente</h1>
        </div>
        
        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <StandardCard 
            title="Benvenuto nel tuo Dashboard Agente" 
            description="Gestisci i tuoi progetti, organizzazioni e simulazioni da un unico posto."
            className="col-span-4"
          >
            <div className="space-y-4">
              <p className="text-gray-600 font-dm-sans text-sm">
                Da qui puoi accedere a tutte le tue attività di agente immobiliare:
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-[#235c4e]" />
                  <span className="text-black font-dm-sans text-sm">
                    Visualizza le organizzazioni di cui fai parte
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-[#235c4e]" />
                  <span className="text-black font-dm-sans text-sm">
                    Gestisci i progetti a cui hai accesso
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-[#235c4e]" />
                  <span className="text-black font-dm-sans text-sm">
                    Crea e gestisci simulazioni
                  </span>
                </li>
              </ul>
            </div>
          </StandardCard>
          
          <StandardCard 
            title="Inviti in Attesa" 
            description={hasInvitations ? 'I tuoi inviti pendenti' : 'Nessun invito pendente'}
            className="col-span-3"
          >
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : hasInvitations ? (
                <div className="space-y-3">
                  {invitations.slice(0, 3).map((invitation) => (
                    <div key={invitation.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-black font-dm-sans text-sm font-medium truncate">
                          {invitation.project_name || invitation.simulation_name || invitation.brokerage_name}
                        </p>
                        <p className="text-gray-500 font-dm-sans text-xs">
                          da {invitation.inviter_name} • {invitation.days_remaining} giorni rimasti
                        </p>
                      </div>
                    </div>
                  ))}
                  {invitations.length > 3 && (
                    <p className="text-gray-500 font-dm-sans text-xs text-center">
                      +{invitations.length - 3} altri inviti
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 font-dm-sans text-sm text-center py-8">
                  Nessun invito in attesa
                </p>
              )}
            </div>
          </StandardCard>
        </div>
      </div>
    </RealEstateAgentLayout>
  );
};

export default AgentDashboard;
