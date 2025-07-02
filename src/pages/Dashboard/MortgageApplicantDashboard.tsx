
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getUserProjects } from '@/services/userProjectService';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, CheckCircle, Clock, Upload, User } from 'lucide-react';
import { logout } from '@/services/authService';

const MortgageApplicantDashboard = () => {
  const { user } = useAuth();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['user-projects', user?.id],
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
      <MainLayout title="My Applications" userEmail={user?.email} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading your applications...</div>
        </div>
      </MainLayout>
    );
  }

  // Mock data for demonstration
  const mockProgress = 65;
  const mockTasks = [
    { id: 1, title: 'Upload Income Verification', status: 'pending', priority: 'high' },
    { id: 2, title: 'Submit Bank Statements', status: 'completed', priority: 'high' },
    { id: 3, title: 'Property Appraisal Documents', status: 'pending', priority: 'medium' },
    { id: 4, title: 'Employment Verification', status: 'completed', priority: 'high' },
  ];

  return (
    <MainLayout title="My Applications" userEmail={user?.email} onLogout={handleLogout}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-primary">My Mortgage Applications</h1>
            <p className="text-muted-foreground">Track your application progress and submit required documents</p>
          </div>
        </div>

        {/* Application Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">
                Active applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockTasks.filter(t => t.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of {mockTasks.length} total tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockTasks.filter(t => t.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Requiring attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Application Progress</CardTitle>
            <CardDescription>
              Your overall progress across all mortgage applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-sm text-muted-foreground">{mockProgress}%</span>
              </div>
              <Progress value={mockProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>
              Documents and information needed to continue your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTasks.filter(task => task.status === 'pending').map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {task.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button size="sm">
                    Upload
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
            <CardDescription>
              View and manage your mortgage applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any active mortgage applications. Contact your lender to get started.
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
                          View Application
                        </Button>
                        <Button size="sm">
                          Continue
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

export default MortgageApplicantDashboard;
