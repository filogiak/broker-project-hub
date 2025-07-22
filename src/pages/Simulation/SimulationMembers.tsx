
import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import SimulationSidebar from '@/components/simulation/SimulationSidebar';
import SimulationHeaderCard from '@/components/simulation/SimulationHeaderCard';
import SimulationMemberActionMenu from '@/components/simulation/SimulationMemberActionMenu';
import SimulationInvitationModal from '@/components/simulation/SimulationInvitationModal';
import SimulationInvitationsModal from '@/components/simulation/SimulationInvitationsModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Mail, Calendar } from 'lucide-react';
import { useSimulationData, useSimulationMembers } from '@/hooks/useSimulationData';
import { useAuth } from '@/hooks/useAuth';
import { simulationService } from '@/services/simulationService';
import { useToast } from '@/hooks/use-toast';
import { PageLoader } from '@/components/ui/page-loader';

const SimulationMembers = () => {
  const { simulationId } = useParams();
  const { user } = useAuth();
  const { data: simulation, isLoading: simulationLoading, error: simulationError } = useSimulationData(simulationId || '');
  const { data: members = [], isLoading: membersLoading, error: membersError, refetch } = useSimulationMembers(simulationId || '');
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [isInvitationsModalOpen, setIsInvitationsModalOpen] = useState(false);
  const { toast } = useToast();

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
            <PageLoader message="Loading members..." />
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

  const handleRemoveMember = async (member: any) => {
    try {
      await simulationService.removeSimulationMember(simulationId!, member.id);
      toast({
        title: "Member Removed",
        description: `${member.profiles?.email} has been removed from the simulation`,
      });
      refetch();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMemberAdded = () => {
    setIsInvitationModalOpen(false);
    refetch();
  };

  // Check if current user can manage members (exclude mortgage applicants from management)
  const currentUserMember = members?.find(member => member.user_id === user.id);
  const canManageMembers = user && currentUserMember && 
    (currentUserMember.role === 'brokerage_owner' || 
     currentUserMember.role === 'simulation_collaborator' ||
     currentUserMember.role === 'broker_assistant' ||
     currentUserMember.role === 'real_estate_agent');

  // Helper function to get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'brokerage_owner':
        return 'Brokerage Owner';
      case 'simulation_collaborator':
        return 'Simulation Collaborator';
      case 'real_estate_agent':
        return 'Real Estate Agent';
      case 'broker_assistant':
        return 'Broker Assistant';
      case 'mortgage_applicant':
        return 'Mortgage Applicant';
      default:
        return role.replace('_', ' ');
    }
  };

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
                  {canManageMembers && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => setIsInvitationsModalOpen(true)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Gestisci Inviti
                      </Button>
                      <Button 
                        className="bg-form-green hover:bg-form-green-hover text-white"
                        onClick={() => setIsInvitationModalOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invita Partecipante
                      </Button>
                    </div>
                  )}
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
                    {canManageMembers && (
                      <Button 
                        className="bg-form-green hover:bg-form-green-hover text-white"
                        onClick={() => setIsInvitationModalOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invita Primo Partecipante
                      </Button>
                    )}
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
                              {getRoleDisplayName(member.role)}
                            </Badge>
                            {member.joined_at && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(member.joined_at).toLocaleDateString('it-IT')}
                                </span>
                              </div>
                            )}
                            {canManageMembers && member.user_id !== user?.id && (
                              <SimulationMemberActionMenu
                                member={member}
                                onDelete={handleRemoveMember}
                                canDelete={true}
                              />
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

      {/* Modals - only show if user can manage members */}
      {canManageMembers && (
        <>
          <SimulationInvitationModal
            isOpen={isInvitationModalOpen}
            onClose={() => setIsInvitationModalOpen(false)}
            simulationId={simulationId!}
            onMemberAdded={handleMemberAdded}
          />

          <SimulationInvitationsModal
            isOpen={isInvitationsModalOpen}
            onClose={() => setIsInvitationsModalOpen(false)}
            simulationId={simulationId!}
          />
        </>
      )}
    </SidebarProvider>
  );
};

export default SimulationMembers;
