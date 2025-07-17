import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Simulation = Database['public']['Tables']['simulations']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Invitation = Database['public']['Tables']['invitations']['Row'];

// Agent-specific types
export interface CreatableBrokerage extends Brokerage {
  access_type: 'member';
  can_create_simulations: boolean;
}

export interface AgentSimulation extends Simulation {
  brokerage_name: string;
  access_type: 'creator' | 'member';
  member_role?: string;
}

export interface AgentProject extends Project {
  brokerage_name: string;
  member_role: string;
  participant_designation?: string;
}

export interface AgentInvitation extends Invitation {
  project_name?: string;
  brokerage_name?: string;
  simulation_name?: string;
  inviter_name: string;
  days_remaining: number;
  invitation_type: 'project' | 'brokerage' | 'simulation';
}

export const agentDataService = {
  // Get brokerages where agent can create simulations
  async getAgentCreatableSimulationBrokerages(userId?: string): Promise<CreatableBrokerage[]> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('brokerage_members')
      .select(`
        brokerages (
          id,
          name,
          description,
          owner_id,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', targetUserId);

    if (error) throw error;

    return (data || []).map(item => ({
      ...item.brokerages!,
      access_type: 'member' as const,
      can_create_simulations: true
    }));
  },

  // Get simulations agent created or was explicitly invited to
  async getAgentDirectSimulations(userId?: string): Promise<AgentSimulation[]> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return [];

    // Get simulations where user is creator or explicit member
    const { data: createdSimulations, error: createdError } = await supabase
      .from('simulations')
      .select(`
        *,
        brokerages!inner (name)
      `)
      .eq('created_by', targetUserId);

    if (createdError) throw createdError;

    const { data: memberSimulations, error: memberError } = await supabase
      .from('simulation_members')
      .select(`
        role,
        simulations!inner (
          *,
          brokerages!inner (name)
        )
      `)
      .eq('user_id', targetUserId)
      .neq('simulations.created_by', targetUserId); // Exclude ones already in created list

    if (memberError) throw memberError;

    const created: AgentSimulation[] = (createdSimulations || []).map(sim => ({
      ...sim,
      brokerage_name: (sim.brokerages as any).name,
      access_type: 'creator' as const
    }));

    const member: AgentSimulation[] = (memberSimulations || []).map(item => ({
      ...item.simulations,
      brokerage_name: (item.simulations.brokerages as any).name,
      access_type: 'member' as const,
      member_role: item.role
    }));

    return [...created, ...member].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  // Get projects where agent is explicit member
  async getAgentDirectProjects(userId?: string): Promise<AgentProject[]> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('project_members')
      .select(`
        role,
        participant_designation,
        projects!inner (
          *,
          brokerages!inner (name)
        )
      `)
      .eq('user_id', targetUserId);

    if (error) throw error;

    return (data || []).map(item => ({
      ...item.projects,
      brokerage_name: (item.projects.brokerages as any).name,
      member_role: item.role,
      participant_designation: item.participant_designation
    }));
  },

  // Get pending invitations relevant to agents (project and simulation)
  async getAgentPendingInvitations(userId?: string): Promise<AgentInvitation[]> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return [];

    // Get user's email for invitation lookup
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', targetUserId)
      .single();

    if (!profile?.email) return [];

    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        projects (name),
        brokerages (name),
        simulations (name),
        profiles!invitations_invited_by_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('email', profile.email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .in('role', ['real_estate_agent', 'simulation_collaborator'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(invitation => ({
      ...invitation,
      project_name: invitation.projects?.name,
      brokerage_name: invitation.brokerages?.name,
      simulation_name: invitation.simulations?.name,
      inviter_name: invitation.profiles
        ? `${invitation.profiles.first_name || ''} ${invitation.profiles.last_name || ''}`.trim() || invitation.profiles.email
        : 'Unknown',
      days_remaining: Math.ceil(
        (new Date(invitation.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      invitation_type: invitation.project_id 
        ? 'project' 
        : invitation.simulation_id 
        ? 'simulation' 
        : 'brokerage'
    }));
  },

  // Get agent stats
  async getAgentStats(userId?: string): Promise<{
    totalProjects: number;
    totalSimulations: number;
    pendingInvitations: number;
    createdSimulations: number;
  }> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) {
      return { totalProjects: 0, totalSimulations: 0, pendingInvitations: 0, createdSimulations: 0 };
    }

    const [projects, simulations, invitations, createdSims] = await Promise.all([
      this.getAgentDirectProjects(targetUserId),
      this.getAgentDirectSimulations(targetUserId),
      this.getAgentPendingInvitations(targetUserId),
      supabase.from('simulations').select('id').eq('created_by', targetUserId)
    ]);

    return {
      totalProjects: projects.length,
      totalSimulations: simulations.length,
      pendingInvitations: invitations.length,
      createdSimulations: createdSims.data?.length || 0
    };
  }
};