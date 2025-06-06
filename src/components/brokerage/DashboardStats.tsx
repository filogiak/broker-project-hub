import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, Users } from 'lucide-react';
import { getBrokerageProjectStats } from '@/services/projectService';
import { getUserProjectStats } from '@/services/projectService';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

interface DashboardStatsProps {
  brokerageId: string;
  projects: Project[];
}

const DashboardStats = ({ brokerageId, projects }: DashboardStatsProps) => {
  const { user } = useAuth();
  const [invitedUsers, setInvitedUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) {
        setInvitedUsers(0);
        setLoading(false);
        return;
      }

      try {
        const stats = await getUserProjectStats(user.id);
        setInvitedUsers(stats.invitedUsers);
      } catch (error) {
        console.error('Error loading stats:', error);
        setInvitedUsers(0);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.id, projects.length]); // Refresh when projects change

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const approvalsDue = projects.filter(p => p.status === 'pending_approval').length;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="card-primary">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-form-placeholder rounded w-24 mb-2"></div>
                <div className="h-8 bg-form-placeholder rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Active Projects */}
      <Card className="card-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjects}</div>
          <p className="text-xs text-muted-foreground">
            Currently active mortgage projects
          </p>
        </CardContent>
      </Card>

      {/* Approvals Due */}
      <Card className="card-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approvals Due</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approvalsDue}</div>
          <p className="text-xs text-muted-foreground">
            Projects pending approval
          </p>
        </CardContent>
      </Card>

      {/* Invited Users */}
      <Card className="card-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invited Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{invitedUsers}</div>
          <p className="text-xs text-muted-foreground">
            Total users invited across projects
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
