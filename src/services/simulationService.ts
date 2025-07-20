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

// Enhanced creation result type with form link status tracking
export interface SimulationCreationResult {
  simulationId: string;
  success: boolean;
  formLinksStatus: 'completed' | 'pending' | 'partial' | 'failed';
  formLinkErrors?: string[];
  participantsCreated: number;
  message?: string;
  canRetryFormLinks?: boolean;
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

  // Create a new simulation
  async createSimulation(simulationData: {
    name: string;
    description?: string;
    brokerageId: string;
  }): Promise<string> {
    console.log('📝 [SIMULATION SERVICE] Creating simulation:', simulationData.name);
    
    // Validate input data with comprehensive checks
    if (!simulationData?.name?.trim()) {
      throw new Error('Simulation name is required and cannot be empty');
    }
    if (!simulationData.brokerageId) {
      throw new Error('Brokerage ID is required');
    }

    const { data, error } = await supabase.rpc('safe_create_simulation', {
      p_name: simulationData.name.trim(),
      p_brokerage_id: simulationData.brokerageId,
      p_description: simulationData.description?.trim() || null,
    });

    if (error) {
      console.error('❌ [SIMULATION SERVICE] Failed to create simulation:', error);
      throw error;
    }
    
    console.log('✅ [SIMULATION SERVICE] Simulation created successfully:', data);
    return data;
  },

  // Create a simulation with complete setup (enhanced with robust error handling)
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
    console.log('🚀 [SIMULATION SERVICE] Starting enhanced simulation creation:', {
      name: setupData?.name,
      participantCount: setupData?.participants?.length || 0,
      brokerageId: setupData?.brokerageId,
      timestamp: new Date().toISOString()
    });

    // Phase 1: Comprehensive input validation
    if (!setupData) {
      throw new Error('Setup data is required');
    }

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

    // Enhanced validation with detailed error messages
    if (!name?.trim()) {
      throw new Error('Simulation name is required and cannot be empty');
    }
    if (!brokerageId?.trim()) {
      throw new Error('Brokerage ID is required');
    }
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      throw new Error('At least one participant is required');
    }
    if (!applicantCount) {
      throw new Error('Applicant count is required');
    }
    if (!projectContactName?.trim()) {
      throw new Error('Project contact name is required');
    }
    if (!projectContactEmail?.trim()) {
      throw new Error('Project contact email is required');
    }

    // Validate participants data with enhanced checks
    participants.forEach((participant, index) => {
      if (!participant) {
        throw new Error(`Participant ${index + 1}: Participant data is required`);
      }
      if (!participant.firstName?.trim()) {
        throw new Error(`Participant ${index + 1}: First name is required`);
      }
      if (!participant.lastName?.trim()) {
        throw new Error(`Participant ${index + 1}: Last name is required`);
      }
      if (!participant.email?.trim()) {
        throw new Error(`Participant ${index + 1}: Email is required`);
      }
      if (!participant.participantDesignation) {
        throw new Error(`Participant ${index + 1}: Participant designation is required`);
      }
    });

    let simulationId: string;
    let participantsCreated = 0;
    let formLinksStatus: 'completed' | 'pending' | 'partial' | 'failed' = 'failed';
    let formLinkErrors: string[] = [];

    try {
      // Step 1: Create the simulation (critical path - must succeed)
      console.log('📝 [SIMULATION SERVICE] Creating simulation...');
      simulationId = await this.createSimulation({
        name: name.trim(),
        description: description?.trim(),
        brokerageId
      });
      console.log('✅ [SIMULATION SERVICE] Simulation created successfully:', simulationId);

      // Step 2: Complete the setup (critical path - must succeed)
      console.log('⚙️ [SIMULATION SERVICE] Completing simulation setup...');
      await this.completeSimulationSetup(simulationId, {
        applicantCount,
        projectContactName: projectContactName.trim(),
        projectContactEmail: projectContactEmail.trim(),
        projectContactPhone: projectContactPhone?.trim(),
      });
      console.log('✅ [SIMULATION SERVICE] Setup completed successfully');

      // Step 3: Create participants (critical path - must succeed)
      console.log('👥 [SIMULATION SERVICE] Creating participants...');
      const { simulationParticipantService } = await import('@/services/simulationParticipantService');
      const createdParticipants = await simulationParticipantService.createParticipants(simulationId, participants);
      participantsCreated = createdParticipants?.length || 0;
      console.log('✅ [SIMULATION SERVICE] Participants created successfully:', participantsCreated);

      // Step 4: Generate form links (non-critical, optimized background operation)
      console.log('🔗 [SIMULATION SERVICE] Starting background form link generation...');
      formLinksStatus = 'pending';
      
      try {
        const { batchFormLinkGeneration } = await import('@/services/batchFormLinkGeneration');
        
        // Increased timeout and better error handling
        const formLinkPromise = batchFormLinkGeneration.generateAllFormLinks({
          simulationId,
          participants: createdParticipants
        });
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Form link generation timeout (60s)')), 60000); // Increased to 60 seconds
        });

        const formLinkResult = await Promise.race([formLinkPromise, timeoutPromise]);

        if (formLinkResult?.success) {
          console.log('✅ [SIMULATION SERVICE] All form links generated successfully');
          formLinksStatus = 'completed';
        } else {
          console.warn('⚠️ [SIMULATION SERVICE] Some form links failed to generate:', formLinkResult?.errors);
          formLinksStatus = 'partial';
          formLinkErrors = formLinkResult?.errors || ['Some form links failed to generate'];
        }
      } catch (formLinkError) {
        console.warn('⚠️ [SIMULATION SERVICE] Form link generation failed (non-critical):', formLinkError);
        formLinksStatus = 'failed';
        const errorMessage = formLinkError instanceof Error ? formLinkError.message : 'Form link generation failed';
        formLinkErrors = [errorMessage];
      }

      // Always return success if core simulation creation succeeded
      const result: SimulationCreationResult = {
        simulationId,
        success: true,
        formLinksStatus,
        formLinkErrors: formLinkErrors.length > 0 ? formLinkErrors : undefined,
        participantsCreated,
        canRetryFormLinks: formLinksStatus !== 'completed',
        message: this.getCreationMessage(formLinksStatus)
      };

      console.log('✅ [SIMULATION SERVICE] Enhanced creation completed:', result);
      return result;

    } catch (error) {
      console.error('❌ [SIMULATION SERVICE] Failed to create simulation with setup:', error);
      
      // If we have a simulationId, try to clean up
      if (simulationId) {
        console.log('🧹 [SIMULATION SERVICE] Attempting cleanup of partially created simulation...');
        try {
          await this.deleteSimulation(simulationId);
          console.log('✅ [SIMULATION SERVICE] Cleanup completed');
        } catch (cleanupError) {
          console.warn('⚠️ [SIMULATION SERVICE] Cleanup failed:', cleanupError);
        }
      }
      
      throw error;
    }
  },

  // Helper method to generate appropriate success messages
  getCreationMessage(formLinksStatus: 'completed' | 'pending' | 'partial' | 'failed'): string {
    switch (formLinksStatus) {
      case 'completed':
        return 'Simulation created successfully with all form links generated';
      case 'pending':
        return 'Simulation created successfully. Form links are being generated in the background';
      case 'partial':
        return 'Simulation created successfully. Some form links are pending - you can retry generation later';
      case 'failed':
        return 'Simulation created successfully. Form link generation failed - you can retry later';
      default:
        return 'Simulation created successfully';
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

  // Retry form link generation for a simulation
  async retryFormLinkGeneration(simulationId: string, maxRetries: number = 3): Promise<{
    success: boolean;
    errors?: string[];
    retryAttempt?: number;
  }> {
    console.log('🔄 [SIMULATION SERVICE] Retrying form link generation for simulation:', simulationId);
    
    if (!simulationId) {
      return { success: false, errors: ['Simulation ID is required'] };
    }
    
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [SIMULATION SERVICE] Retry attempt ${attempt}/${maxRetries}`);
        
        // Get simulation participants with validation
        const { simulationParticipantService } = await import('@/services/simulationParticipantService');
        const participants = await simulationParticipantService.getSimulationParticipants(simulationId);
        
        if (!participants || participants.length === 0) {
          console.warn('⚠️ [SIMULATION SERVICE] No participants found for form link generation');
          return { success: false, errors: ['No participants found'] };
        }

        // Generate form links with exponential backoff timeout
        const { batchFormLinkGeneration } = await import('@/services/batchFormLinkGeneration');
        
        const timeout = Math.min(30000 * Math.pow(2, attempt - 1), 120000); // 30s, 60s, 120s max
        const formLinkPromise = batchFormLinkGeneration.generateAllFormLinks({
          simulationId,
          participants
        });
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Form link generation timeout (${timeout/1000}s)`)), timeout);
        });

        const result = await Promise.race([formLinkPromise, timeoutPromise]);
        
        if (result?.success) {
          console.log(`✅ [SIMULATION SERVICE] Form link generation retry succeeded on attempt ${attempt}`);
          return { success: true, retryAttempt: attempt };
        } else {
          lastError = result?.errors?.[0] || 'Unknown error during retry';
          console.warn(`⚠️ [SIMULATION SERVICE] Retry attempt ${attempt} failed:`, lastError);
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error during retry';
        console.error(`❌ [SIMULATION SERVICE] Retry attempt ${attempt} failed:`, error);
        
        // Wait before next retry (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    return {
      success: false,
      errors: [`All ${maxRetries} retry attempts failed. Last error: ${lastError}`],
      retryAttempt: maxRetries
    };
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
