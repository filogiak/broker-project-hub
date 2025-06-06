
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Building, Settings, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import CreateBrokerageOwnerForm from '@/components/admin/CreateBrokerageOwnerForm';
import CreateBrokerageForm from '@/components/admin/CreateBrokerageForm';
import BrokerageOwnersList from '@/components/admin/BrokerageOwnersList';
import BrokeragesList from '@/components/admin/BrokeragesList';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLogout = async () => {
    try {
      await logout();
      // Force page refresh to ensure clean logout
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
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

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">147</div>
              <p className="text-xs text-muted-foreground">
                +12 new this month
              </p>
            </CardContent>
          </Card>

          <Card className="card-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Brokerages</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">
                +3 new this quarter
              </p>
            </CardContent>
          </Card>

          <Card className="card-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <p className="text-xs text-muted-foreground">
                Uptime this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="brokerages" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Brokerage Management
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
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
