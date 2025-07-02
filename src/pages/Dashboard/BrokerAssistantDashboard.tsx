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
import { FileSpreadsheet, Users, Calendar, User, Building } from 'lucide-react';
import { logout } from '@/services/authService';

const BrokerAssistantDashboard = () => {
  const { user } = useAuth();
  const { selectedRole, isMultiRole } = useRoleSelection();

  // Fetch projects and brokerages with role-aware filtering
  const { data: workItems, isLoading } = useQuery({
    queryKey: ['broker-assistant-work', user?.id, selectedRole],
    queryFn: async () => {
      if (!user?.id) return { brokerages: [], projects: [] };

      // Get brokerage memberships for broker assistant role
      let brokerageQuery = supabase
        .from('brokerage_members')
        .select(`
          brokerage_id,
          role,
          joined_at,
          brokerages!inner (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('user_id', user.id);

      // Filter by selected role if multi-role user
      if (selectedRole && isMultiRole) {
        brokerageQuery = brokerageQuery.eq('role', selectedRole);
      } else {
        brokerageQuery = brokerageQuery.eq('role', 'broker_assistant');
      }

      const { data: brokerageData, error: brokerageError } = await brokerageQuery;
      
      if (brokerageError) {
        console.error('Error fetching brokerage data:', brokerageError);
        return { brokerages: [], projects: [] };
      }

      // Get project memberships for broker assistant role
      let projectQuery = supabase
        .from('project_members')
        .select(`
          project_id,
          role,
          joined_at,
          projects!inner (
            id,
            name,
            description,
            status,
            project_type,
            created_at,
            brokerage_id,
            brokerages!inner (
              name
            )
          )
        `)
        .eq('user_id', user.id);

      // Filter by selected role if multi-role user 
      if (selectedRole && isMultiRole) {
        projectQuery = projectQuery.eq('role', selectedRole);
      } else {
        projectQuery = projectQuery.eq('role', 'broker_assistant');
      }

      const { data: projectData, error: projectError } = await projectQuery;
      
      if (projectError) {
        console.error('Error fetching project data:', projectError);
        return { brokerages: [], projects: [] };
      }

      return {
        brokerages: brokerageData || [],
        projects: projectData || []
      };
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
      <MainLayout title="Broker Assistant Dashboard" userEmail={user?.email} onLogout={handleLogout}>
        <div className="max-w-6xl mx-auto space-y-6">
          {isMultiRole && <RoleSelector />}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Loading your work items...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Add type guard and safe destructuring
  const { brokerages = [], projects = [] } = workItems || { brokerages: [], projects: [] };

  return (
    <MainLayout title="Broker Assistant Dashboard" userEmail={user?.email} onLogout={handleLogout}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Role Selector for multi-role users */}
        {isMultiRole && <RoleSelector />}

        <div className="flex items-center gap-3 mb-6">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary">Broker Assistant Dashboard</h1>
            <p className="text-muted-foreground">Support brokerage operations and assist with project management</p>
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
              <CardTitle className="text-sm font-medium">Brokerages</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{brokerages.length}</div>
              <p className="text-xs text-muted-foreground">
                {selectedRole && isMultiRole 
                  ? `Supporting as ${selectedRole.replace('_', ' ')}`
                  : 'Organizations you support'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">
                Projects requiring assistance
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
                Items requiring attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Invitations Widget */}
        <PendingInvitationsWidget />

        {/* Work Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brokerages */}
          <Card>
            <CardHeader>
              <CardTitle>Your Brokerages</CardTitle>
              <CardDescription>
                {selectedRole && isMultiRole 
                  ? `Brokerages you support as ${selectedRole.replace('_', ' ')}`
                  : 'Organizations where you provide broker assistance'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {brokerages.length === 0 ? (
                <div className="text-center py-6">
                  <Building className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No brokerages assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {brokerages.map((membership) => {
                    const brokerage = membership.brokerages;
                    return (
                      <div key={brokerage.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{brokerage.name}</h4>
                            {brokerage.description && (
                              <p className="text-sm text-muted-foreground mt-1">{brokerage.description}</p>
                            )}
                            <Badge variant="outline" className="mt-2">{membership.role.replace('_', ' ')}</Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            Assist
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Projects</CardTitle>
              <CardDescription>
                Projects where you provide broker assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-6">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No projects assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((membership) => {
                    const project = membership.projects;
                    return (
                      <div key={project.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{project.name}</h4>
                            {project.description && (
                              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{project.status}</Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {project.brokerages.name}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Assist
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default BrokerAssistantDashboard;
