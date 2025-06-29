
import React, { useState, useEffect } from 'react';
import { FileText, Clock, Users } from 'lucide-react';
import StandardCard from '@/components/ui/StandardCard';
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
          <div key={i} className="bg-white rounded-[12px] border-2 border-form-green p-6 solid-shadow-green">
            <div className="animate-pulse">
              <div className="h-4 bg-vibe-green-light rounded w-24 mb-2"></div>
              <div className="h-8 bg-vibe-green-light rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StandardCard
        title="Active Projects"
        description="Currently active mortgage projects"
        icon={FileText}
        variant="overview"
      >
        <div className="text-3xl font-bold text-form-green font-dm-sans">
          {activeProjects}
        </div>
      </StandardCard>

      <StandardCard
        title="Approvals Due"
        description="Projects pending approval"
        icon={Clock}
        variant="overview"
      >
        <div className="text-3xl font-bold text-form-green font-dm-sans">
          {approvalsDue}
        </div>
      </StandardCard>

      <StandardCard
        title="Invited Users"
        description="Total users invited across projects"
        icon={Users}
        variant="overview"
      >
        <div className="text-3xl font-bold text-form-green font-dm-sans">
          {invitedUsers}
        </div>
      </StandardCard>
    </div>
  );
};

export default DashboardStats;
