
import React, { useState, useEffect } from 'react';
import { FileText, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getUserProjectStats } from '@/services/projectService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

interface DashboardStatsProps {
  brokerageId: string;
  projects: Project[];
}

const DashboardStats = ({ brokerageId, projects }: DashboardStatsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
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
    toast({
      title: "Gestione Progetti",
      description: "Vai alla sezione progetti per gestire i tuoi progetti attivi."
    });
  };

  const handleApprovalsClick = () => {
    toast({
      title: "Approvazioni",
      description: "Controlla i progetti in attesa di approvazione."
    });
  };

  const handleUsersClick = () => {
    toast({
      title: "Gestione Utenti",
      description: "Gestisci gli utenti invitati nei tuoi progetti."
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
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
      <Card 
        className="cursor-pointer bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light press-down-effect" 
        onClick={handleProjectsClick}
      >
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
              <h3 className="font-semibold text-black font-dm-sans mb-2 text-xl">Progetti Attivi</h3>
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

      <Card 
        className="cursor-pointer bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light press-down-effect" 
        onClick={handleApprovalsClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
              <Clock className="h-9 w-9 text-form-green-dark" />
            </div>
            <span className="bg-accent-yellow text-form-green text-xs font-medium px-2 py-1 rounded-md">
              {approvalsDue} in attesa
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-black font-dm-sans mb-2 text-xl">Approvazioni Pending</h3>
              <p className="text-sm text-gray-600 font-dm-sans leading-relaxed">
                Progetti che richiedono la tua approvazione
              </p>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">In attesa</span>
              <span className="font-semibold text-form-green">{approvalsDue}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light press-down-effect" 
        onClick={handleUsersClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
              <Users className="h-9 w-9 text-form-green-dark" />
            </div>
            <span className="bg-accent-yellow text-form-green text-xs font-medium px-2 py-1 rounded-md">
              {invitedUsers} utenti
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-black font-dm-sans mb-2 text-xl">Utenti Invitati</h3>
              <p className="text-sm text-gray-600 font-dm-sans leading-relaxed">
                Gestisci tutti gli utenti invitati nei progetti
              </p>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">Totale</span>
              <span className="font-semibold text-form-green">{invitedUsers}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
