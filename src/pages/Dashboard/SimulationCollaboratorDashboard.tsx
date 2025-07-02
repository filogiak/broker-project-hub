import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import RoleSelector from '@/components/dashboard/RoleSelector';
import PendingInvitationsWidget from '@/components/dashboard/PendingInvitationsWidget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlaskConical, Users, Calendar, User, Building } from 'lucide-react';
import { logout } from '@/services/authService';

const SimulationCollaboratorDashboard = () => {
  const { user } = useAuth();
  const { selectedRole, isMultiRole } = useRoleSelection();

  // Fetch simulations where user is a member with role-aware filtering
  const { data: simulations = [], isLoading } = useQuery({
    queryKey: ['user-simulations', user?.id, selectedRole],
    queryFn: async () => {
      if (!user?.id) return [];

      // Build the query step by step to handle the database relation properly
      let query = supabase
        .from('simulation_members')
        .select(`
          simulation_id,
          role,
          joined_at,
          simulations!inner (
            id,
            name,
            description,
            status,
            created_at,
            brokerage_id
          )
        `)
        .eq('user_id', user.id);

      // Filter by selected role if multi-role user has selected a specific role
      if (selectedRole && isMultiRole) {
        query = query.eq('role', selectedRole);
      }

      const { data: simulationData, error } = await query;
      
      if (error) {
        console.error('Error fetching simulations:', error);
        return [];
      }

      // Now fetch brokerage info separately to avoid relation issues
      const simulationsWithBrokerages = await Promise.all(
        (simulationData || []).map(async (memberRecord) => {
          const simulation = memberRecord.simulations;
          
          // Fetch brokerage info separately
          const { data: brokerageData } = await supabase
            .from('brokerages')
            .select('name')
            .eq('id', simulation.brokerage_id)
            .single();

          return {
            ...memberRecord,
            simulations: {
              ...simulation,
              brokerages: brokerageData || { name: 'Unknown' }
            }
          };
        })
      );

      return simulationsWithBrokerages;
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Simulation Collaborator Dashboard" userEmail={user?.email} onLogout={handleLogout}>
        <div className="max-w-6xl mx-auto space-y-6">
          {isMultiRole && <RoleSelector />}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Loading your simulations...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Simulation Collaborator Dashboard" userEmail={user?.email} onLogout={handleLogout}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Role Selector for multi-role users */}
        {isMultiRole && <RoleSelector />}

        <div className="flex items-center gap-3 mb-6">
          <FlaskConical className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary">Simulation Collaborator Dashboard</h1>
            <p className="text-muted-foreground">Work on mortgage simulations and collaborate with your team</p>
          </div>
          {selectedRole && isMultiRole && (
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Role: <span className="font-medium text-foreground">{selectedRole.replace('_', ' ')}</span>
              </span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Simulations</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{simulations.length}</div>
              <p className="text-xs text-muted-foreground">
                {selectedRole && isMultiRole 
                  ? `As ${selectedRole.replace('_', ' ')}`
                  : 'Simulations you\'re working on'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Items requiring your attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collaborations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{simulations.length}</div>
              <p className="text-xs text-muted-foreground">
                Team projects in progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Invitations Widget */}
        <PendingInvitationsWidget />

        {/* Simulations List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Simulations</CardTitle>
            <CardDescription>
              {selectedRole && isMultiRole 
                ? `Collaborate on mortgage simulations as ${selectedRole.replace('_', ' ')}`
                : 'Collaborate on mortgage simulations and contribute to analysis'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {simulations.length === 0 ? (
              <div className="text-center py-8">
                <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Simulations Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedRole && isMultiRole 
                    ? `You haven't been assigned to any simulations as ${selectedRole.replace('_', ' ')} yet.`
                    : 'You haven\'t been assigned to any simulations yet.'
                  } Contact your team to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {simulations.map((memberRecord) => {
                  const simulation = memberRecord.simulations;
                  return (
                    <div key={simulation.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{simulation.name}</h3>
                          {simulation.description && (
                            <p className="text-muted-foreground text-sm mt-1">{simulation.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{simulation.status}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {simulation.brokerages?.name || 'Unknown'}
                            </Badge>
                            <Badge variant="outline">{memberRecord.role.replace('_', ' ')}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button size="sm">
                            Collaborate
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SimulationCollaboratorDashboard;
