
import React, { useState, useEffect } from 'react';
import { FileText, Clock, Users } from 'lucide-react';
import BrokerageOverviewCard from './BrokerageOverviewCard';
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
  }, [user?.id, projects.length]);

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const approvalsDue = projects.filter(p => p.status === 'pending_approval').length;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="gomutuo-card-stat">
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-form-placeholder rounded w-24 mb-2"></div>
                <div className="h-8 bg-form-placeholder rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BrokerageOverviewCard
        title="Active Projects"
        value={activeProjects}
        description="Currently active mortgage projects"
        icon={FileText}
        className="gomutuo-card-stat"
      />

      <BrokerageOverviewCard
        title="Approvals Due"
        value={approvalsDue}
        description="Projects pending approval"
        icon={Clock}
        className="gomutuo-card-stat"
      />

      <BrokerageOverviewCard
        title="Invited Users"
        value={invitedUsers}
        description="Total users invited across projects"
        icon={Users}
        className="gomutuo-card-stat"
      />
    </div>
  );
};

export default DashboardStats;
