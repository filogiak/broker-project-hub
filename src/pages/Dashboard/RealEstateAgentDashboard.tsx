import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { useQuery } from '@tanstack/react-query';
import { getUserProjects } from '@/services/userProjectService';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import RoleSelector from '@/components/dashboard/RoleSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, FileText, Users, Calendar, User } from 'lucide-react';
import { logout } from '@/services/authService';

const RealEstateAgentDashboard = () => {
  const { user } = useAuth();
  const { selectedRole, isMultiRole } = useRoleSelection();

  // Fetch projects with role-aware filtering
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['user-projects', user?.id, selectedRole],
    queryFn: async () => {
      if (!user?.id) return [];

      // If user has multiple roles and has selected a specific role, filter by that role
      if (selectedRole && isMultiRole) {
        const { data, error } = await supabase
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
              created_at
            )
          `)
          .eq('user_id', user.id)
          .eq('role', selectedRole);

        if (error) {
          console.error('Error fetching role-specific projects:', error);
          return [];
        }

        return data?.map(pm => pm.projects) || [];
      }

      // Otherwise, use the general user projects service
      return getUserProjects(user.id);
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
      <MainLayout title="Agent Dashboard" userEmail={user?.email} onLogout={handleLogout}>
        <div className="max-w-6xl mx-auto space-y-6">
          {isMultiRole && <RoleSelector />}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Loading your projects...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Agent Dashboard" userEmail={user?.email} onLogout={handleLogout}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Role Selector for multi-role users */}
        {isMultiRole && <RoleSelector />}

        <div className="flex items-center gap-3 mb-6">
          <Home className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary">Real Estate Agent Dashboard</h1>
            <p className="text-muted-foreground">Manage your client projects and transactions</p>
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
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">
                {selectedRole && isMultiRole 
                  ? `As ${selectedRole.replace('_', ' ')}`
                  : 'Projects under management'
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
                Items requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">
                Active client relationships
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Client Projects</CardTitle>
            <CardDescription>
              {selectedRole && isMultiRole 
                ? `Manage and track progress for your real estate transactions as ${selectedRole.replace('_', ' ')}`
                : 'Manage and track progress for your real estate transactions'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedRole && isMultiRole 
                    ? `You haven't been assigned to any projects as ${selectedRole.replace('_', ' ')} yet.`
                    : 'You haven\'t been assigned to any projects yet.'
                  } Contact your brokerage to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        {project.description && (
                          <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{project.status}</Badge>
                          {project.project_type && (
                            <Badge variant="outline">{project.project_type.replace('_', ' ')}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button size="sm">
                          Manage
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

export default RealEstateAgentDashboard;
