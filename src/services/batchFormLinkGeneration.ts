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
  // Generate all form links for a simulation in parallel
  async generateAllFormLinks(request: BatchFormLinkRequest): Promise<{
    success: boolean;
    results: FormLinkResult[];
    errors: string[];
  }> {
    const { simulationId, participants } = request;
    const results: FormLinkResult[] = [];
    const errors: string[] = [];
    
    // Prepare form link generation tasks
    const linkGenerationTasks: Promise<FormLinkResult>[] = [];
    
    // Generate project form link (use first participant)
    const primaryParticipant = participants.find(p => 
      p.participant_designation === 'applicant_one' || p.participant_designation === 'solo_applicant'
    ) || participants[0];
    
    if (primaryParticipant) {
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
      linkGenerationTasks.push(
        this.generateSingleFormLink({
          simulationId,
          participant,
          formType: 'applicant',
          formSlug: 'gestionale-intestatario',
        })
      );
    }
    
    // Execute all form link generations in parallel
    const taskResults = await Promise.allSettled(linkGenerationTasks);
    
    // Process results
    taskResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        if (!result.value.success) {
          errors.push(`Failed to generate link: ${result.value.error}`);
        }
      } else {
        errors.push(`Task ${index} failed: ${result.reason}`);
      }
    });
    
    // Update simulation to mark forms as generated
    if (errors.length === 0) {
      try {
        await supabase
          .from('simulations')
          .update({ forms_generated_at: new Date().toISOString() })
          .eq('id', simulationId);
      } catch (error) {
        console.error('Failed to update simulation forms_generated_at:', error);
        errors.push('Failed to update simulation status');
      }
    }
    
    return {
      success: errors.length === 0,
      results,
      errors,
    };
  },
  
  // Generate a single form link and store it
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
    try {
      // Check if link already exists
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
        return {
          participantDesignation: participant.participant_designation,
          formType,
          link: existingLink.link,
          success: true,
        };
      }
      
      // Generate new link via external API
      const generatedLink = await formLinkService.getFormLink({
        name: `${participant.first_name} ${participant.last_name}`,
        email: participant.email,
        phone: participant.phone || '',
        formSlug,
      });
      
      // Store the new link in database
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
        console.error('Error storing form link:', insertError);
        // Still return the generated link
      }
      
      return {
        participantDesignation: participant.participant_designation,
        formType,
        link: generatedLink,
        success: true,
      };
      
    } catch (error) {
      console.error('Error generating form link:', error);
      return {
        participantDesignation: participant.participant_designation,
        formType,
        link: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  
  // Generate a random token
  generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },
};