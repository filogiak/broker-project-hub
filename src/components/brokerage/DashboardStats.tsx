
import React, { useState, useEffect } from 'react';
import { FileText, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getUserProjectStats } from '@/services/projectService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BrokerageSimulationStats from './BrokerageSimulationStats';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

interface DashboardStatsProps {
  brokerageId: string;
  projects: Project[];
}

const DashboardStats = ({
  brokerageId,
  projects
}: DashboardStatsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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

  const handleProjectsClick = () => {
    navigate(`/brokerage/${brokerageId}/projects`);
  };

  const handleApprovalsClick = () => {
    toast({
      title: "Approvazioni",
      description: "Controlla i progetti in attesa di approvazione."
    });
  };

  const handleUsersClick = () => {
    navigate(`/brokerage/${brokerageId}/users`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="cursor-pointer bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="cursor-pointer bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light press-down-effect" onClick={handleProjectsClick}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
              <FileText className="h-9 w-9 text-form-green-dark" />
            </div>
            <span className="bg-accent-yellow text-form-green text-xs font-medium px-2 py-1 rounded-md">
              {activeProjects} attivi
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-black font-dm-sans mb-2 text-xl">Gestione Progetti</h3>
              <p className="text-sm text-gray-600 font-dm-sans leading-relaxed">
                Gestisci e monitora i progetti attualmente in corso
              </p>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">Totale</span>
              <span className="font-semibold text-form-green">{activeProjects}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <BrokerageSimulationStats brokerageId={brokerageId} />

      <Card className="cursor-pointer bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light press-down-effect" onClick={handleUsersClick}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
              <Users className="h-9 w-9 text-form-green-dark" />
            </div>
            <span className="bg-accent-yellow text-form-green text-xs font-medium px-2 py-1 rounded-md">
              Gestisci team
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-black font-dm-sans mb-2 text-xl">Gestione Utenti</h3>
              <p className="text-sm text-gray-600 font-dm-sans leading-relaxed">
                Invita e gestisci i collaboratori del brokerage
              </p>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">Azione</span>
              <span className="font-semibold text-form-green">Gestisci</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
