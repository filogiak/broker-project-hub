import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import AdminPermissionCheck from '@/components/admin/AdminPermissionCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building, Settings, UserPlus, LogOut, FolderOpen, RefreshCw, HelpCircle, GitBranch } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { getTotalUsersCount, getTotalBrokeragesCount, getTotalProjectsCount } from '@/services/adminService';
import CreateBrokerageOwnerForm from '@/components/admin/CreateBrokerageOwnerForm';
import CreateBrokerageForm from '@/components/admin/CreateBrokerageForm';
import BrokerageOwnersList from '@/components/admin/BrokerageOwnersList';
import BrokeragesList from '@/components/admin/BrokeragesList';
import QuestionForm from '@/components/admin/QuestionForm';
import QuestionsList from '@/components/admin/QuestionsList';
import LogicRulesManager from '@/components/admin/LogicRulesManager';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [questionsRefreshTrigger, setQuestionsRefreshTrigger] = useState(0);
  const [questionViewMode, setQuestionViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBrokerages: 0,
    totalProjects: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    loadStats();
  };

  const handleQuestionSuccess = () => {
    setQuestionsRefreshTrigger(prev => prev + 1);
    setQuestionViewMode('list');
    setEditingQuestion(null);
  };

  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionViewMode('create');
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setQuestionViewMode('edit');
  };

  const handleCancelQuestion = () => {
    setQuestionViewMode('list');
    setEditingQuestion(null);
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      setStatsError(null);
      
      console.log('Loading dashboard statistics...');
      
      const [usersCount, brokeragesCount, projectsCount] = await Promise.allSettled([
        getTotalUsersCount(),
        getTotalBrokeragesCount(),
        getTotalProjectsCount(),
      ]);
      
      const stats = {
        totalUsers: usersCount.status === 'fulfilled' ? usersCount.value : 0,
        totalBrokerages: brokeragesCount.status === 'fulfilled' ? brokeragesCount.value : 0,
        totalProjects: projectsCount.status === 'fulfilled' ? projectsCount.value : 0,
      };
      
      if (usersCount.status === 'rejected') {
        console.error('Failed to load users count:', usersCount.reason);
      }
      if (brokeragesCount.status === 'rejected') {
        console.error('Failed to load brokerages count:', brokeragesCount.reason);
      }
      if (projectsCount.status === 'rejected') {
        console.error('Failed to load projects count:', projectsCount.reason);
      }
      
      setStats(stats);
      console.log('Dashboard statistics loaded successfully:', stats);
    } catch (error) {
      console.error('Load stats error:', error);
      setStatsError('Failed to load some statistics. Please try refreshing.');
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <AdminPermissionCheck>
      <MainLayout 
        title="Admin Dashboard" 
        userEmail={user?.email || ''}
        onLogout={handleLogout}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">System Administration</h1>
              <p className="text-muted-foreground">Manage users, brokerages, and system settings</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={loadingStats}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System Settings
              </Button>
              <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {statsError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive text-sm">{statsError}</p>
            </div>
          )}

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : stats.totalUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  All registered users
                </p>
              </CardContent>
            </Card>

            <Card className="card-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Brokerages</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : stats.totalBrokerages}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active organizations
                </p>
              </CardContent>
            </Card>

            <Card className="card-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : stats.totalProjects}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active projects
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="brokerages" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Brokerage Management
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Question Management
              </TabsTrigger>
              <TabsTrigger value="logic" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Logic Rules
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CreateBrokerageOwnerForm onSuccess={handleRefresh} />
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>
                        Create brokerage owner accounts who can then manage their own organizations.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>• Brokerage owners will receive an email invitation</p>
                        <p>• They can create their own brokerage after signing in</p>
                        <p>• Each owner can only have one brokerage (1:1 relationship)</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <BrokerageOwnersList refreshTrigger={refreshTrigger} />
            </TabsContent>

            <TabsContent value="brokerages" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CreateBrokerageForm onSuccess={handleRefresh} />
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Brokerage Management</CardTitle>
                      <CardDescription>
                        Create brokerages and assign them to existing brokerage owners.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>• Only owners without a brokerage can be selected</p>
                        <p>• Creating a brokerage automatically links it to the owner</p>
                        <p>• Owners will gain full access to their brokerage dashboard</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <BrokeragesList refreshTrigger={refreshTrigger} />
            </TabsContent>

            <TabsContent value="questions" className="space-y-6">
              {questionViewMode === 'list' ? (
                <QuestionsList
                  refreshTrigger={questionsRefreshTrigger}
                />
              ) : (
                <QuestionForm />
              )}
            </TabsContent>

            <TabsContent value="logic" className="space-y-6">
              <LogicRulesManager />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </AdminPermissionCheck>
  );
};

export default AdminDashboard;
