
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import RoleSelector from '@/components/dashboard/RoleSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Beaker, BarChart3, Users, PlayCircle, PauseCircle, Settings, User } from 'lucide-react';
import { logout } from '@/services/authService';

const SimulationCollaboratorDashboard = () => {
  const { user } = useAuth();
  const { selectedRole, isMultiRole } = useRoleSelection();

  const { data: simulations = [], isLoading } = useQuery({
    queryKey: ['user-simulations', user?.id, selectedRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching simulations for user:', user.id, 'with role context:', selectedRole);
      
      // First get simulation IDs where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('simulation_members')
        .select('simulation_id, role')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching simulation members:', memberError);
        return [];
      }

      console.log('Member data:', memberData);

      if (!memberData || memberData.length === 0) {
        console.log('No simulation memberships found');
        return [];
      }

      // Filter by selected role if in multi-role context
      const filteredMemberData = selectedRole && isMultiRole 
        ? memberData.filter(item => item.role === selectedRole)
        : memberData;

      if (filteredMemberData.length === 0) {
        console.log('No simulations found for selected role:', selectedRole);
        return [];
      }

      const simulationIds = filteredMemberData.map(item => item.simulation_id);
      console.log('Simulation IDs for role context:', simulationIds);

      // Then get simulation details
      const { data: simulationData, error: simulationError } = await supabase
        .from('simulations')
        .select('*')
        .in('id', simulationIds);

      if (simulationError) {
        console.error('Error fetching simulations:', simulationError);
        return [];
      }

      console.log('Simulation data:', simulationData);
      return simulationData || [];
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
      <MainLayout title="Simulation Lab" userEmail={user?.email} onLogout={handleLogout}>
        <div className="max-w-6xl mx-auto space-y-6">
          {isMultiRole && <RoleSelector />}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Loading simulations...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calculate stats from actual simulations data
  const mockStats = {
    activeSimulations: simulations.filter(s => s.status === 'active').length,
    completedSimulations: simulations.filter(s => s.status === 'completed').length,
    draftSimulations: simulations.filter(s => s.status === 'draft').length,
    totalCollaborations: simulations.length,
  };

  return (
    <MainLayout title="Simulation Lab" userEmail={user?.email} onLogout={handleLogout}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Role Selector for multi-role users */}
        {isMultiRole && <RoleSelector />}

        <div className="flex items-center gap-3 mb-6">
          <Beaker className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary">Simulation Laboratory</h1>
            <p className="text-muted-foreground">Collaborate on mortgage and real estate simulations</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Simulations</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.activeSimulations}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Simulations</CardTitle>
              <PauseCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.draftSimulations}</div>
              <p className="text-xs text-muted-foreground">
                In development
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.completedSimulations}</div>
              <p className="text-xs text-muted-foreground">
                Successfully finished
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collaborations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalCollaborations}</div>
              <p className="text-xs text-muted-foreground">
                {selectedRole && isMultiRole ? `As ${selectedRole.replace('_', ' ')}` : 'Total participated'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Simulations List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Simulations</CardTitle>
            <CardDescription>
              {selectedRole && isMultiRole 
                ? `Simulations you're collaborating on as ${selectedRole.replace('_', ' ')}`
                : 'Simulations you\'re collaborating on or managing'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {simulations.length === 0 ? (
              <div className="text-center py-8">
                <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Simulations Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedRole && isMultiRole 
                    ? `You haven't been assigned to any simulations as ${selectedRole.replace('_', ' ')} yet.`
                    : 'You haven\'t been assigned to any simulations yet.'
                  } Contact your team lead to get started.
                </p>
                <Button>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Request Access
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {simulations.map((simulation) => (
                  <div key={simulation.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{simulation.name}</h3>
                        {simulation.description && (
                          <p className="text-muted-foreground text-sm mt-1">{simulation.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={
                              simulation.status === 'active' ? 'default' :
                              simulation.status === 'completed' ? 'secondary' : 'outline'
                            }
                          >
                            {simulation.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(simulation.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                        <Button size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SimulationCollaboratorDashboard;
