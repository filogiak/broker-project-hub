
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { useQuery } from '@tanstack/react-query';
import { getUserProjects } from '@/services/userProjectService';
import MainLayout from '@/components/layout/MainLayout';
import RoleSelector from '@/components/dashboard/RoleSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, FileText, Users, TrendingUp, Calendar, MessageSquare, User } from 'lucide-react';
import { logout } from '@/services/authService';

const BrokerAssistantDashboard = () => {
  const { user } = useAuth();
  const { selectedRole, isMultiRole } = useRoleSelection();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['user-projects', user?.id, selectedRole],
    queryFn: () => getUserProjects(user?.id || ''),
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
      <MainLayout title="Assistant Dashboard" userEmail={user?.email} onLogout={handleLogout}>
        <div className="max-w-6xl mx-auto space-y-6">
          {isMultiRole && <RoleSelector />}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Loading dashboard...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Mock data for demonstration
  const mockStats = {
    activeProjects: projects.length,
    pendingReviews: 3,
    clientMeetings: 2,
    completedTasks: 15,
  };

  const mockRecentActivity = [
    { action: 'Document reviewed', project: 'Smith Family Purchase', time: '2 hours ago' },
    { action: 'Client meeting scheduled', project: 'Johnson Refinance', time: '4 hours ago' },
    { action: 'Application submitted', project: 'Wilson Investment', time: '1 day ago' },
  ];

  return (
    <MainLayout title="Assistant Dashboard" userEmail={user?.email} onLogout={handleLogout}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Role Selector for multi-role users */}
        {isMultiRole && <RoleSelector />}

        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary">Broker Assistant Dashboard</h1>
            <p className="text-muted-foreground">Support brokerage operations and client management</p>
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
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                Projects under management
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.pendingReviews}</div>
              <p className="text-xs text-muted-foreground">
                Items awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.clientMeetings}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {selectedRole && isMultiRole ? `As ${selectedRole.replace('_', ' ')}` : 'This month'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {selectedRole && isMultiRole 
                ? `Latest updates across your managed projects as ${selectedRole.replace('_', ' ')}`
                : 'Latest updates across your managed projects'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.project}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>Managed Projects</CardTitle>
            <CardDescription>
              {selectedRole && isMultiRole 
                ? `Projects you're assisting with as ${selectedRole.replace('_', ' ')}`
                : 'Projects you\'re assisting with as a broker assistant'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Projects Assigned</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedRole && isMultiRole 
                    ? `You haven't been assigned to any projects as ${selectedRole.replace('_', ' ')} yet.`
                    : 'You haven\'t been assigned to any projects yet.'
                  } Contact your broker to get started.
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
                          View Project
                        </Button>
                        <Button size="sm">
                          Assist
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

export default BrokerAssistantDashboard;
