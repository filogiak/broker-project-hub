import { supabase } from '@/integrations/supabase/client';
import { formLinkService } from './formLinkService';

export interface SimulationFormLink {
  id: string;
  simulation_id: string;
  participant_designation: string;
  form_type: string;
  form_slug: string;
  link: string;
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

type ParticipantDesignation = 'solo_applicant' | 'applicant_one' | 'applicant_two';

interface FormLinkData {
  simulationId: string;
  participantDesignation: ParticipantDesignation;
  formType: string;
  formSlug: string;
  participantName: string;
  participantEmail: string;
  participantPhone: string;
}

export const simulationFormLinksService = {
  // Get existing form links for a simulation
  async getSimulationFormLinks(simulationId: string): Promise<SimulationFormLink[]> {
    const { data, error } = await supabase
      .from('form_links')
      .select('*')
      .eq('simulation_id', simulationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching simulation form links:', error);
      throw new Error('Failed to fetch form links');
    }

    return data || [];
  },

  // Get or create a specific form link
  async getOrCreateFormLink(linkData: FormLinkData): Promise<string> {
    const { simulationId, participantDesignation, formType, formSlug, participantName, participantEmail, participantPhone } = linkData;

    // First, try to find existing link
    const { data: existingLink, error: fetchError } = await supabase
      .from('form_links')
      .select('*')
      .eq('simulation_id', simulationId)
      .eq('participant_designation', participantDesignation)
      .eq('form_type', formType)
      .eq('form_slug', formSlug)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing form link:', fetchError);
      throw new Error('Failed to check existing form links');
    }

    // If link exists and is not expired, return it
    if (existingLink && new Date(existingLink.expires_at) > new Date()) {
      return existingLink.link;
    }

    // Generate new link via external API
    const generatedLink = await formLinkService.getFormLink({
      name: participantName,
      email: participantEmail,
      phone: participantPhone,
      formSlug: formSlug,
    });

    // Store the new link in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    const { data: newLinkData, error: insertError } = await supabase
      .from('form_links')
      .upsert({
        simulation_id: simulationId,
        participant_designation: participantDesignation as ParticipantDesignation,
        form_type: formType,
        form_slug: formSlug,
        link: generatedLink,
        token: this.generateToken(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing form link:', insertError);
      // Return the generated link anyway, even if storage failed
      return generatedLink;
    }

    return newLinkData.link;
  },

  // Generate all required form links for a simulation based on participants
  async generateAllFormLinks(simulationId: string, participants: any[]): Promise<Record<string, string>> {
    const links: Record<string, string> = {};

    for (const participant of participants) {
      const participantKey = `${participant.participant_designation}`;
      
      // Generate project form link (using first available participant)
      if (participant.participant_designation === 'applicant_one' || 
          (participant.participant_designation === 'solo_applicant' && !links['project'])) {
        const projectLink = await this.getOrCreateFormLink({
          simulationId,
          participantDesignation: participant.participant_designation as ParticipantDesignation,
          formType: 'project',
          formSlug: 'gestionale-progetto',
          participantName: `${participant.first_name} ${participant.last_name}`,
          participantEmail: participant.email,
          participantPhone: participant.phone || '',
        });
        links['project'] = projectLink;
      }

      // Generate participant-specific form link
      const participantLink = await this.getOrCreateFormLink({
        simulationId,
        participantDesignation: participant.participant_designation as ParticipantDesignation,
        formType: 'participant',
        formSlug: 'gestionale-intestatario',
        participantName: `${participant.first_name} ${participant.last_name}`,
        participantEmail: participant.email,
        participantPhone: participant.phone || '',
      });
      links[participantKey] = participantLink;
    }

    return links;
  },

  generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },
};