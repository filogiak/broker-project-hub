
import { supabase } from '@/integrations/supabase/client';
import { formLinkService } from './formLinkService';
import type { Database } from '@/integrations/supabase/types';

type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

interface BatchFormLinkRequest {
  simulationId: string;
  participants: Array<{
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    participant_designation: ParticipantDesignation;
  }>;
}

interface FormLinkResult {
  participantDesignation: string;
  formType: string;
  link: string;
  success: boolean;
  error?: string;
}

export const batchFormLinkGeneration = {
  // Generate all form links for a simulation with enhanced context and error handling
  async generateAllFormLinks(request: BatchFormLinkRequest): Promise<{
    success: boolean;
    results: FormLinkResult[];
    errors: string[];
  }> {
    const { simulationId, participants } = request;
    const results: FormLinkResult[] = [];
    const errors: string[] = [];
    
    console.log('[BATCH FORM LINK] Starting form link generation with enhanced context for simulation:', simulationId);
    console.log('[BATCH FORM LINK] Participants count:', participants.length);
    
    // Prepare form link generation tasks
    const linkGenerationTasks: Promise<FormLinkResult>[] = [];
    
    // Generate project form link (use first participant)
    const primaryParticipant = participants.find(p => 
      p.participant_designation === 'applicant_one' || p.participant_designation === 'solo_applicant'
    ) || participants[0];
    
    if (primaryParticipant) {
      console.log('[BATCH FORM LINK] Adding project form link task with simulation context');
      linkGenerationTasks.push(
        this.generateSingleFormLink({
          simulationId,
          participant: primaryParticipant,
          formType: 'project',
          formSlug: 'gestionale-progetto',
        })
      );
    }
    
    // Generate participant-specific form links
    for (const participant of participants) {
      console.log('[BATCH FORM LINK] Adding participant form link task for:', participant.participant_designation);
      linkGenerationTasks.push(
        this.generateSingleFormLink({
          simulationId,
          participant,
          formType: 'applicant',
          formSlug: 'gestionale-intestatario',
        })
      );
    }
    
    console.log('[BATCH FORM LINK] Total tasks to execute:', linkGenerationTasks.length);
    
    // Execute all form link generations in parallel with timeout
    try {
      const taskResults = await Promise.allSettled(linkGenerationTasks);
      
      // Process results with better error categorization and isolation
      taskResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (!result.value.success) {
            const errorMsg = `${result.value.formType} form for ${result.value.participantDesignation}: ${result.value.error}`;
            errors.push(errorMsg);
            console.warn('[BATCH FORM LINK] Task failed (isolated):', errorMsg);
          } else {
            console.log('[BATCH FORM LINK] Task succeeded:', result.value.formType, result.value.participantDesignation);
          }
        } else {
          const errorMsg = `Task ${index} completely failed: ${result.reason}`;
          errors.push(errorMsg);
          console.error('[BATCH FORM LINK] Task rejected (isolated):', errorMsg);
        }
      });
      
      const successCount = results.filter(r => r.success).length;
      console.log('[BATCH FORM LINK] Generation summary:', {
        total: linkGenerationTasks.length,
        successful: successCount,
        failed: errors.length
      });
      
      // Update simulation status if all links generated successfully
      if (errors.length === 0) {
        try {
          await supabase
            .from('simulations')
            .update({ forms_generated_at: new Date().toISOString() })
            .eq('id', simulationId);
          console.log('[BATCH FORM LINK] Updated simulation forms_generated_at');
        } catch (updateError) {
          console.error('[BATCH FORM LINK] Failed to update simulation forms_generated_at:', updateError);
          errors.push('Failed to update simulation status');
        }
      }
      
      return {
        success: errors.length === 0,
        results,
        errors,
      };
      
    } catch (error) {
      console.error('[BATCH FORM LINK] Unexpected error during batch generation:', error);
      return {
        success: false,
        results: [],
        errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  },
  
  // Generate a single form link with enhanced context passing and error isolation
  async generateSingleFormLink({
    simulationId,
    participant,
    formType,
    formSlug,
  }: {
    simulationId: string;
    participant: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
      participant_designation: ParticipantDesignation;
    };
    formType: string;
    formSlug: string;
  }): Promise<FormLinkResult> {
    const logPrefix = `[FORM LINK ${participant.participant_designation}]`;
    
    try {
      console.log(`${logPrefix} Starting form link generation for ${formType} with simulation context`);
      
      // Check if link already exists and is valid
      const { data: existingLink } = await supabase
        .from('form_links')
        .select('*')
        .eq('simulation_id', simulationId)
        .eq('participant_designation', participant.participant_designation)
        .eq('form_type', formType)
        .eq('form_slug', formSlug)
        .single();
      
      // If valid link exists, return it
      if (existingLink && new Date(existingLink.expires_at) > new Date()) {
        console.log(`${logPrefix} Using existing valid form link`);
        return {
          participantDesignation: participant.participant_designation,
          formType,
          link: existingLink.link,
          success: true,
        };
      }
      
      // Generate new link via external API with enhanced context and retry logic
      console.log(`${logPrefix} Generating new form link via external API with simulation context`);
      const generatedLink = await this.generateLinkWithRetry({
        name: `${participant.first_name} ${participant.last_name}`,
        email: participant.email,
        phone: participant.phone || '',
        formSlug,
        simulationId, // Pass simulation context for RLS
      }, 3); // 3 retry attempts
      
      // Store the new link in database with proper context
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry
      
      const { error: insertError } = await supabase
        .from('form_links')
        .upsert({
          simulation_id: simulationId,
          participant_designation: participant.participant_designation,
          form_type: formType,
          form_slug: formSlug,
          link: generatedLink,
          token: this.generateToken(),
          expires_at: expiresAt.toISOString(),
        });
      
      if (insertError) {
        console.error(`${logPrefix} Error storing form link (non-blocking):`, insertError);
        // Still return the generated link even if storage fails
      } else {
        console.log(`${logPrefix} Form link stored successfully`);
      }
      
      return {
        participantDesignation: participant.participant_designation,
        formType,
        link: generatedLink,
        success: true,
      };
      
    } catch (error) {
      console.error(`${logPrefix} Error generating form link (isolated):`, error);
      return {
        participantDesignation: participant.participant_designation,
        formType,
        link: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  
  // Generate form link with exponential backoff retry and enhanced context
  async generateLinkWithRetry(
    params: { name: string; email: string; phone: string; formSlug: string; simulationId?: string },
    maxRetries: number
  ): Promise<string> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[RETRY] Attempt ${attempt}/${maxRetries} for form link generation with context`);
        const link = await formLinkService.getFormLink(params);
        console.log(`[RETRY] Success on attempt ${attempt}`);
        return link;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`[RETRY] Attempt ${attempt} failed (isolated):`, lastError.message);
        
        // Don't retry on certain types of errors
        if (lastError.message.includes('permission') || lastError.message.includes('406')) {
          console.error(`[RETRY] Non-retryable error encountered:`, lastError.message);
          throw lastError;
        }
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`[RETRY] Waiting ${delay}ms before next attempt`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`[RETRY] All ${maxRetries} attempts failed`);
    throw lastError!;
  },
  
  // Generate a random token
  generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },
};
