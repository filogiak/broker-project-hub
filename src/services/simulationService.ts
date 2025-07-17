
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Simulation = Database['public']['Tables']['simulations']['Row'];
type SimulationInsert = Database['public']['Tables']['simulations']['Insert'];
type SimulationMember = Database['public']['Tables']['simulation_members']['Row'];

// Extended type for simulation members with joined profile data
export type SimulationMemberWithProfile = SimulationMember & {
  profiles: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export const simulationService = {
  // Get all simulations for a brokerage
  async getBrokerageSimulations(brokerageId: string): Promise<Simulation[]> {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('brokerage_id', brokerageId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get a single simulation by ID
  async getSimulation(simulationId: string): Promise<Simulation | null> {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  // Create a new simulation
  async createSimulation(simulationData: {
    name: string;
    description?: string;
    brokerageId: string;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('safe_create_simulation', {
      p_name: simulationData.name,
      p_brokerage_id: simulationData.brokerageId,
      p_description: simulationData.description || null,
    });

    if (error) throw error;
    return data;
  },

  // Create a simulation with complete setup (new streamlined method)
  async createSimulationWithSetup(setupData: {
    name: string;
    description?: string;
    brokerageId: string;
    applicantCount: Database['public']['Enums']['applicant_count'];
    projectContactName: string;
    projectContactEmail: string;
    projectContactPhone?: string;
    participants: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      participantDesignation: Database['public']['Enums']['participant_designation'];
    }>;
  }): Promise<string> {
    // Create the simulation first
    const simulationId = await this.createSimulation({
      name: setupData.name,
      description: setupData.description,
      brokerageId: setupData.brokerageId
    });

    // Complete the setup immediately
    await this.completeSimulationSetup(simulationId, {
      applicantCount: setupData.applicantCount,
      projectContactName: setupData.projectContactName,
      projectContactEmail: setupData.projectContactEmail,
      projectContactPhone: setupData.projectContactPhone,
    });

    // Create participants
    const { simulationParticipantService } = await import('@/services/simulationParticipantService');
    await simulationParticipantService.createParticipants(simulationId, setupData.participants);

    return simulationId;
  },

  // Update a simulation
  async updateSimulation(simulationId: string, updates: Partial<SimulationInsert>): Promise<void> {
    const { error } = await supabase
      .from('simulations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', simulationId);

    if (error) throw error;
  },

  // Delete a simulation with proper authorization and cascading
  async deleteSimulation(simulationId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    deletedMembers?: number;
    deletedInvitations?: number;
    simulationName?: string;
  }> {
    const { data, error } = await supabase.rpc('safe_delete_simulation', {
      p_simulation_id: simulationId
    });

    if (error) throw error;
    return data as {
      success: boolean;
      message?: string;
      error?: string;
      deletedMembers?: number;
      deletedInvitations?: number;
      simulationName?: string;
    };
  },

  // Get simulation members with profile data
  async getSimulationMembers(simulationId: string): Promise<SimulationMemberWithProfile[]> {
    const { data, error } = await supabase
      .from('simulation_members')
      .select(`
        *,
        profiles!simulation_members_user_id_fkey (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('simulation_id', simulationId);

    if (error) throw error;
    return data || [];
  },

  // Get simulation with participants
  async getSimulationWithParticipants(simulationId: string): Promise<{
    simulation: Simulation | null;
    participants: Database['public']['Tables']['simulation_participants']['Row'][];
  }> {
    const [simulationResult, participantsResult] = await Promise.all([
      this.getSimulation(simulationId),
      supabase
        .from('simulation_participants')
        .select('*')
        .eq('simulation_id', simulationId)
        .order('created_at', { ascending: true })
    ]);

    if (participantsResult.error) throw participantsResult.error;

    return {
      simulation: simulationResult,
      participants: participantsResult.data || []
    };
  },

  // Complete simulation setup
  async completeSimulationSetup(simulationId: string, setupData: {
    applicantCount?: Database['public']['Enums']['applicant_count'];
    projectContactName?: string;
    projectContactEmail?: string;
    projectContactPhone?: string;
  }): Promise<void> {
    const updates: Partial<SimulationInsert> = {
      setup_completed_at: new Date().toISOString(),
      applicant_count: setupData.applicantCount,
      project_contact_name: setupData.projectContactName,
      project_contact_email: setupData.projectContactEmail,
      project_contact_phone: setupData.projectContactPhone,
    };

    await this.updateSimulation(simulationId, updates);
  },

  // Update simulation configuration
  async updateSimulationConfig(simulationId: string, config: {
    applicantCount?: Database['public']['Enums']['applicant_count'];
    projectContactName?: string;
    projectContactEmail?: string;
    projectContactPhone?: string;
  }): Promise<void> {
    const updates: Partial<SimulationInsert> = {
      applicant_count: config.applicantCount,
      project_contact_name: config.projectContactName,
      project_contact_email: config.projectContactEmail,
      project_contact_phone: config.projectContactPhone,
    };

    await this.updateSimulation(simulationId, updates);
  },

  // Member management functions
  async removeSimulationMember(simulationId: string, memberId: string): Promise<void> {
    console.log('🗑️ [SIMULATION SERVICE] Removing simulation member:', { simulationId, memberId });
    
    const { error } = await supabase
      .from('simulation_members')
      .delete()
      .eq('simulation_id', simulationId)
      .eq('id', memberId);

    if (error) {
      console.error('❌ [SIMULATION SERVICE] Error removing simulation member:', error);
      throw error;
    }

    console.log('✅ [SIMULATION SERVICE] Successfully removed simulation member');
  },

  async updateSimulationMemberRole(
    simulationId: string, 
    memberId: string, 
    newRole: Database['public']['Enums']['user_role']
  ): Promise<void> {
    console.log('🔄 [SIMULATION SERVICE] Updating simulation member role:', { simulationId, memberId, newRole });
    
    const { error } = await supabase
      .from('simulation_members')
      .update({ role: newRole })
      .eq('simulation_id', simulationId)
      .eq('id', memberId);

    if (error) {
      console.error('❌ [SIMULATION SERVICE] Error updating simulation member role:', error);
      throw error;
    }

    console.log('✅ [SIMULATION SERVICE] Successfully updated simulation member role');
  }
};
