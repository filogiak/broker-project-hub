
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import SimulationSidebar from '@/components/simulation/SimulationSidebar';
import SimulationHeaderCard from '@/components/simulation/SimulationHeaderCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Mail, Calendar } from 'lucide-react';
import { useSimulationData, useSimulationMembers } from '@/hooks/useSimulationData';
import { useAuth } from '@/hooks/useAuth';

const SimulationMembers = () => {
  const { simulationId } = useParams();
  const { user } = useAuth();
  const { data: simulation, isLoading: simulationLoading, error: simulationError } = useSimulationData(simulationId || '');
  const { data: members = [], isLoading: membersLoading, error: membersError } = useSimulationMembers(simulationId || '');

  // Debug logging
  console.log('SimulationMembers - members data:', members);
  console.log('SimulationMembers - members error:', membersError);

  if (!simulationId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (simulationLoading || membersLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <SimulationSidebar />
          <SidebarInset>
            <div className="flex-1 p-8">
              <div className="animate-pulse space-y-6">
                <div className="bg-white border border-[#BEB8AE] rounded-[12px] p-6">
                  <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-96"></div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (simulationError || !simulation) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <SimulationSidebar />
          <SidebarInset>
            <div className="flex-1 p-8">
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Simulazione non trovata
                </h2>
                <p className="text-gray-600">
                  La simulazione richiesta non esiste o non hai i permessi per visualizzarla.
                </p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SimulationSidebar />
        <SidebarInset>
          <div className="flex-1 p-8 space-y-8">
            <SimulationHeaderCard simulation={simulation} />

            {/* Members Management */}
            <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-dm-sans text-xl text-black">
                      Partecipanti Simulazione
                    </CardTitle>
                    <CardDescription className="font-dm-sans">
                      Gestisci i partecipanti alla simulazione
                    </CardDescription>
                  </div>
                  <Button className="bg-form-green hover:bg-form-green-hover text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invita Partecipante
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {membersError && (
                  <div className="text-red-600 mb-4">
                    Error loading members: {membersError.message}
                  </div>
                )}
                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-form-green/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-form-green" />
                    </div>
                    <h3 className="font-semibold text-xl mb-2">Nessun partecipante</h3>
                    <p className="text-gray-600 mb-6">
                      Invita altri utenti a collaborare a questa simulazione.
                    </p>
                    <Button className="bg-form-green hover:bg-form-green-hover text-white">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invita Primo Partecipante
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-form-green/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-form-green" />
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {member.profiles?.first_name && member.profiles?.last_name
                                  ? `${member.profiles.first_name} ${member.profiles.last_name}`
                                  : member.profiles?.email || 'Utente'}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {member.profiles?.email || 'Email non disponibile'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {member.role.replace('_', ' ')}
                            </Badge>
                            {member.joined_at && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(member.joined_at).toLocaleDateString('it-IT')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SimulationMembers;
