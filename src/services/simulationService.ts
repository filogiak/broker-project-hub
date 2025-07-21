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

// Enhanced creation result type with clearer status
export interface SimulationCreationResult {
  simulationId: string;
  success: boolean;
  coreCreationSuccess: boolean;
  formLinksStatus: 'pending' | 'generated' | 'failed';
  formLinkErrors?: string[];
  participantsCreated: number;
  message: string;
  canProceed: boolean; // Whether user can use the simulation
}

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

  // Create a new simulation (core operation only) - FIXED: Removed duplicate validation
  async createSimulation(simulationData: {
    name: string;
    description?: string;
    brokerageId: string;
  }): Promise<string> {
    console.log('[SIMULATION] Creating core simulation:', simulationData.name);
    
    // Basic validation only - UI validation is primary source of truth
    if (!simulationData.brokerageId) {
      throw new Error('Brokerage ID is required');
    }

    const { data, error } = await supabase.rpc('safe_create_simulation', {
      p_name: simulationData.name || '', // Don't throw on empty, let RPC handle it
      p_brokerage_id: simulationData.brokerageId,
      p_description: simulationData.description || null,
    });

    if (error) {
      console.error('[SIMULATION] Failed to create core simulation:', error);
      throw error;
    }
    
    console.log('[SIMULATION] Core simulation created successfully:', data);
    return data;
  },

  // Enhanced simulation creation with better error separation
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
  }): Promise<SimulationCreationResult> {
    console.log('[SIMULATION] Starting enhanced simulation creation');

    // Phase 1: Basic validation only - UI is primary validator
    const {
      name,
      description,
      brokerageId,
      applicantCount,
      projectContactName,
      projectContactEmail,
      projectContactPhone,
      participants
    } = setupData;

    // Minimal validation - don't duplicate UI validation
    if (!brokerageId) throw new Error('Brokerage ID is required');
    if (!participants?.length) throw new Error('At least one participant is required');
    if (!applicantCount) throw new Error('Applicant count is required');

    let simulationId: string;
    let participantsCreated = 0;
    let formLinksStatus: 'pending' | 'generated' | 'failed' = 'pending';
    let formLinkErrors: string[] = [];

    try {
      // CRITICAL OPERATIONS - Must succeed for simulation to be usable
      console.log('[SIMULATION] Phase 1: Creating core simulation');
      simulationId = await this.createSimulation({
        name: name || 'Untitled Simulation', // Defensive fallback
        description: description,
        brokerageId
      });

      console.log('[SIMULATION] Phase 2: Completing setup');
      await this.completeSimulationSetup(simulationId, {
        applicantCount,
        projectContactName: projectContactName,
        projectContactEmail: projectContactEmail,
        projectContactPhone: projectContactPhone,
      });

      console.log('[SIMULATION] Phase 3: Creating participants');
      const { simulationParticipantService } = await import('@/services/simulationParticipantService');
      const createdParticipants = await simulationParticipantService.createParticipants(simulationId, participants);
      participantsCreated = createdParticipants?.length || 0;

      console.log('[SIMULATION] Critical operations completed successfully');

      // NON-CRITICAL OPERATION - Form link generation (fully async, isolated errors)
      console.log('[SIMULATION] Phase 4: Starting background form link generation');
      
      // Start form link generation in background with proper error isolation
      this.generateFormLinksBackground(simulationId, createdParticipants)
        .then(result => {
          console.log('[SIMULATION] Background form link generation completed:', result);
        })
        .catch(error => {
          console.warn('[SIMULATION] Background form link generation failed (non-blocking):', error);
        });

      // Return success immediately - core simulation is ready
      const result: SimulationCreationResult = {
        simulationId,
        success: true,
        coreCreationSuccess: true,
        formLinksStatus: 'pending',
        participantsCreated,
        message: 'Simulation created successfully. Form links are being generated in the background.',
        canProceed: true
      };

      console.log('[SIMULATION] Creation completed successfully:', result);
      return result;

    } catch (error) {
      console.error('[SIMULATION] Critical operation failed:', error);
      
      // Enhanced error classification for better UX
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Don't expose internal database errors to users
        if (errorMessage.includes('duplicate key') || errorMessage.includes('constraint')) {
          errorMessage = 'A simulation with this configuration already exists';
        } else if (errorMessage.includes('permission') || errorMessage.includes('not authorized')) {
          errorMessage = 'You do not have permission to create simulations';
        } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          errorMessage = 'Network error. Please try again.';
        }
      }
      
      // If we have a simulationId, try to clean up
      if (simulationId) {
        console.log('[SIMULATION] Attempting cleanup of partially created simulation');
        try {
          await this.deleteSimulation(simulationId);
          console.log('[SIMULATION] Cleanup completed');
        } catch (cleanupError) {
          console.warn('[SIMULATION] Cleanup failed:', cleanupError);
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  // Background form link generation with improved error isolation and context setting
  async generateFormLinksBackground(simulationId: string, participants: any[]): Promise<void> {
    try {
      console.log('[SIMULATION] Starting background form link generation with proper context');
      
      // Ensure we have simulation context for RLS
      const simulation = await this.getSimulation(simulationId);
      if (!simulation) {
        throw new Error(`Simulation ${simulationId} not found for form link generation`);
      }
      
      const { batchFormLinkGeneration } = await import('@/services/batchFormLinkGeneration');
      
      // Enhanced form link generation with simulation context
      const formLinkPromise = batchFormLinkGeneration.generateAllFormLinks({
        simulationId,
        participants
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Form link generation timeout')), 90000); // 90 seconds
      });

      const result = await Promise.race([formLinkPromise, timeoutPromise]);

      if (result?.success) {
        console.log('[SIMULATION] Background form link generation successful');
        
        // Update simulation to mark forms as generated
        await supabase
          .from('simulations')
          .update({ forms_generated_at: new Date().toISOString() })
          .eq('id', simulationId);
      } else {
        console.warn('[SIMULATION] Background form link generation had errors (non-blocking):', result?.errors);
      }
    } catch (error) {
      console.error('[SIMULATION] Background form link generation failed (isolated):', error);
      // Don't throw - this is background operation and should not affect main flow
    }
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

  // Retry form link generation with enhanced context and error handling
  async retryFormLinkGeneration(simulationId: string): Promise<{
    success: boolean;
    errors?: string[];
  }> {
    console.log('[SIMULATION] Retrying form link generation for simulation:', simulationId);
    
    if (!simulationId) {
      return { success: false, errors: ['Simulation ID is required'] };
    }
    
    try {
      // Ensure simulation exists and user has access
      const simulation = await this.getSimulation(simulationId);
      if (!simulation) {
        return { success: false, errors: ['Simulation not found or access denied'] };
      }
      
      // Get simulation participants
      const { simulationParticipantService } = await import('@/services/simulationParticipantService');
      const participants = await simulationParticipantService.getSimulationParticipants(simulationId);
      
      if (!participants || participants.length === 0) {
        console.warn('[SIMULATION] No participants found for form link generation');
        return { success: false, errors: ['No participants found'] };
      }

      // Generate form links with proper context and increased timeout
      const { batchFormLinkGeneration } = await import('@/services/batchFormLinkGeneration');
      
      const formLinkPromise = batchFormLinkGeneration.generateAllFormLinks({
        simulationId,
        participants
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Form link generation timeout')), 90000); // 90 seconds
      });

      const result = await Promise.race([formLinkPromise, timeoutPromise]);
      
      console.log('[SIMULATION] Form link generation retry completed:', result);
      return result || { success: false, errors: ['Unknown error during retry'] };
      
    } catch (error) {
      console.error('[SIMULATION] Form link generation retry failed:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error during retry']
      };
    }
  },

  // Member management functions
  async removeSimulationMember(simulationId: string, memberId: string): Promise<void> {
    console.log('[SIMULATION] Removing simulation member:', { simulationId, memberId });
    
    const { error } = await supabase
      .from('simulation_members')
      .delete()
      .eq('simulation_id', simulationId)
      .eq('id', memberId);

    if (error) {
      console.error('[SIMULATION] Error removing simulation member:', error);
      throw error;
    }

    console.log('[SIMULATION] Successfully removed simulation member');
  },

  async updateSimulationMemberRole(
    simulationId: string, 
    memberId: string, 
    newRole: Database['public']['Enums']['user_role']
  ): Promise<void> {
    console.log('[SIMULATION] Updating simulation member role:', { simulationId, memberId, newRole });
    
    const { error } = await supabase
      .from('simulation_members')
      .update({ role: newRole })
      .eq('simulation_id', simulationId)
      .eq('id', memberId);

    if (error) {
      console.error('[SIMULATION] Error updating simulation member role:', error);
      throw error;
    }

    console.log('[SIMULATION] Successfully updated simulation member role');
  }
};
