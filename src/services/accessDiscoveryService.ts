import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Simulation = Database['public']['Tables']['simulations']['Row'];

export interface AccessibleBrokerage extends Brokerage {
  access_type: 'owner' | 'project_member' | 'simulation_member' | 'brokerage_member';
  project_count?: number;
  simulation_count?: number;
}

export interface AccessibleProject extends Project {
  brokerage_name: string;
}

export interface AccessibleSimulation extends Simulation {
  brokerage_name: string;
}

export const accessDiscoveryService = {
  // Get all brokerages user has access to (owned, project member, simulation member, or brokerage member)
  async getAccessibleBrokerages(userId?: string): Promise<AccessibleBrokerage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = userId || user?.id;
    
    if (!currentUserId) return [];

    const accessibleBrokerages = new Map<string, AccessibleBrokerage>();

    // 1. Brokerages owned by user
    const { data: ownedBrokerages } = await supabase
      .from('brokerages')
      .select('*')
      .eq('owner_id', currentUserId);

    ownedBrokerages?.forEach(brokerage => {
      accessibleBrokerages.set(brokerage.id, {
        ...brokerage,
        access_type: 'owner'
      });
    });

    // 2. Brokerages through project membership
    const { data: projectMemberships } = await supabase
      .from('project_members')
      .select(`
        project_id,
        projects!inner (
          brokerage_id,
          brokerages!inner (*)
        )
      `)
      .eq('user_id', currentUserId);

    projectMemberships?.forEach(membership => {
      const brokerage = membership.projects.brokerages;
      if (!accessibleBrokerages.has(brokerage.id)) {
        accessibleBrokerages.set(brokerage.id, {
          ...brokerage,
          access_type: 'project_member'
        });
      }
    });

    // 3. Brokerages through simulation membership
    const { data: simulationMemberships } = await supabase
      .from('simulation_members')
      .select(`
        simulations!inner (
          brokerage_id
        )
      `)
      .eq('user_id', currentUserId);

    if (simulationMemberships) {
      const brokerageIds = [...new Set(simulationMemberships.map(m => m.simulations.brokerage_id))];
      
      const { data: simulationBrokerages } = await supabase
        .from('brokerages')
        .select('*')
        .in('id', brokerageIds);

      simulationBrokerages?.forEach(brokerage => {
        if (!accessibleBrokerages.has(brokerage.id)) {
          accessibleBrokerages.set(brokerage.id, {
            ...brokerage,
            access_type: 'simulation_member'
          });
        }
      });
    }

    // 4. Brokerages through direct membership
    const { data: brokerageMemberships } = await supabase
      .from('brokerage_members')
      .select(`
        brokerage_id,
        brokerages!inner (*)
      `)
      .eq('user_id', currentUserId);

    brokerageMemberships?.forEach(membership => {
      const brokerage = membership.brokerages;
      if (!accessibleBrokerages.has(brokerage.id)) {
        accessibleBrokerages.set(brokerage.id, {
          ...brokerage,
          access_type: 'brokerage_member'
        });
      }
    });

    const result = Array.from(accessibleBrokerages.values());
    
    // Add counts for each brokerage
    for (const brokerage of result) {
      // Use the database function to check if user is broker assistant
      const { data: isBrokerAssistant } = await supabase.rpc('user_is_broker_assistant_for_brokerage', {
        brokerage_uuid: brokerage.id,
        user_uuid: currentUserId
      });
      
      if (brokerage.access_type === 'owner' || isBrokerAssistant) {
        // Count all projects in brokerage
        const { count: projectCount } = await supabase
          .from('projects')
          .select('id', { count: 'exact' })
          .eq('brokerage_id', brokerage.id);
        
        brokerage.project_count = projectCount || 0;
      } else {
        // Count only projects user has access to
        const { count: projectCount } = await supabase
          .from('project_members')
          .select('project_id', { count: 'exact' })
          .eq('user_id', currentUserId)
          .in('project_id', 
            (await supabase
              .from('projects')
              .select('id')
              .eq('brokerage_id', brokerage.id)
            ).data?.map(p => p.id) || []
          );

        brokerage.project_count = projectCount || 0;
      }

      // Count simulations user has access to in this brokerage
      const { count: simulationCount } = await supabase
        .from('simulation_members')
        .select('simulation_id', { count: 'exact' })
        .eq('user_id', currentUserId)
        .in('simulation_id',
          (await supabase
            .from('simulations')
            .select('id')
            .eq('brokerage_id', brokerage.id)
          ).data?.map(s => s.id) || []
        );

      brokerage.simulation_count = simulationCount || 0;
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  },

  // Helper method to check if user is broker assistant for a brokerage
  async isUserBrokerageAssistant(brokerageId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('user_is_broker_assistant_for_brokerage', {
      brokerage_uuid: brokerageId,
      user_uuid: userId
    });

    if (error) {
      console.error('Error checking broker assistant status:', error);
      return false;
    }

    return data || false;
  },

  // Get all projects user has access to
  async getAccessibleProjects(userId?: string): Promise<AccessibleProject[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = userId || user?.id;
    
    if (!currentUserId) return [];

    const { data: projects } = await supabase
      .from('project_members')
      .select(`
        projects!inner (
          *,
          brokerages!inner (name)
        )
      `)
      .eq('user_id', currentUserId);

    return projects?.map(p => ({
      ...p.projects,
      brokerage_name: p.projects.brokerages.name
    })) || [];
  },

  // Get all simulations user has access to
  async getAccessibleSimulations(userId?: string): Promise<AccessibleSimulation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = userId || user?.id;
    
    if (!currentUserId) return [];

    const { data: simulationMemberships } = await supabase
      .from('simulation_members')
      .select(`
        simulations!inner (*)
      `)
      .eq('user_id', currentUserId);

    if (!simulationMemberships) return [];

    // Get brokerage names for each simulation
    const brokerageIds = [...new Set(simulationMemberships.map(m => m.simulations.brokerage_id))];
    const { data: brokerages } = await supabase
      .from('brokerages')
      .select('id, name')
      .in('id', brokerageIds);

    const brokerageMap = new Map(brokerages?.map(b => [b.id, b.name]) || []);

    return simulationMemberships.map(m => ({
      ...m.simulations,
      brokerage_name: brokerageMap.get(m.simulations.brokerage_id) || 'Unknown'
    }));
  },

  // Check if user can access a specific brokerage (updated to use new database function)
  async canAccessBrokerage(brokerageId: string, userId?: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = userId || user?.id;
    
    if (!currentUserId) return false;

    const { data, error } = await supabase.rpc('user_can_access_brokerage', {
      brokerage_uuid: brokerageId,
      user_uuid: currentUserId
    });

    if (error) {
      console.error('Error checking brokerage access:', error);
      return false;
    }

    return data || false;
  }
};
