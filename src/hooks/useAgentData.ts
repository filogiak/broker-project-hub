
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { agentDataService, type AgentSimulation, type AgentProject, type AgentInvitation, type CreatableBrokerage } from '@/services/agentDataService';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface AgentDataState {
  creatableBrokerages: CreatableBrokerage[];
  simulations: AgentSimulation[];
  projects: AgentProject[];
  invitations: AgentInvitation[];
  stats: {
    totalProjects: number;
    totalSimulations: number;
    pendingInvitations: number;
    createdSimulations: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: AgentDataState = {
  creatableBrokerages: [],
  simulations: [],
  projects: [],
  invitations: [],
  stats: {
    totalProjects: 0,
    totalSimulations: 0,
    pendingInvitations: 0,
    createdSimulations: 0
  },
  loading: false,
  error: null
};

export const useAgentData = (roleFilter?: UserRole) => {
  const { user } = useAuth();
  const [data, setData] = useState<AgentDataState>(initialState);

  const loadAgentData = async () => {
    if (!user?.id) return;

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [brokerages, simulations, projects, invitations, stats] = await Promise.all([
        agentDataService.getAgentCreatableSimulationBrokerages(user.id, roleFilter),
        agentDataService.getAgentDirectSimulations(user.id, roleFilter),
        agentDataService.getAgentDirectProjects(user.id, roleFilter),
        agentDataService.getAgentPendingInvitations(user.id), // Invitations not filtered
        agentDataService.getAgentStats(user.id, roleFilter)
      ]);

      setData({
        creatableBrokerages: brokerages,
        simulations,
        projects,
        invitations,
        stats,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading agent data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load agent data'
      }));
    }
  };

  const refreshData = () => loadAgentData();

  const refreshInvitations = async () => {
    if (!user?.id) return;

    try {
      const [invitations, stats] = await Promise.all([
        agentDataService.getAgentPendingInvitations(user.id), // Invitations not filtered
        agentDataService.getAgentStats(user.id, roleFilter)
      ]);

      setData(prev => ({
        ...prev,
        invitations,
        stats
      }));
    } catch (error) {
      console.error('Error refreshing invitations:', error);
    }
  };

  const refreshSimulations = async () => {
    if (!user?.id) return;

    try {
      const [simulations, stats] = await Promise.all([
        agentDataService.getAgentDirectSimulations(user.id, roleFilter),
        agentDataService.getAgentStats(user.id, roleFilter)
      ]);

      setData(prev => ({
        ...prev,
        simulations,
        stats
      }));
    } catch (error) {
      console.error('Error refreshing simulations:', error);
    }
  };

  const refreshProjects = async () => {
    if (!user?.id) return;

    try {
      const [projects, stats] = await Promise.all([
        agentDataService.getAgentDirectProjects(user.id, roleFilter),
        agentDataService.getAgentStats(user.id, roleFilter)
      ]);

      setData(prev => ({
        ...prev,
        projects,
        stats
      }));
    } catch (error) {
      console.error('Error refreshing projects:', error);
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user?.id) {
      loadAgentData();
    } else {
      setData(initialState);
    }
  }, [user?.id, roleFilter]);

  return {
    ...data,
    refreshData,
    refreshInvitations,
    refreshSimulations,
    refreshProjects,
    hasData: data.simulations.length > 0 || data.projects.length > 0,
    hasInvitations: data.invitations.length > 0
  };
};
