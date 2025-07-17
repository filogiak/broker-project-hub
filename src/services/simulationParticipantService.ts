import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SimulationParticipant = Database['public']['Tables']['simulation_participants']['Row'];
type SimulationParticipantInsert = Database['public']['Tables']['simulation_participants']['Insert'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

export interface ParticipantData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  participantDesignation: ParticipantDesignation;
}

export const simulationParticipantService = {
  // Get all participants for a simulation
  async getSimulationParticipants(simulationId: string): Promise<SimulationParticipant[]> {
    const { data, error } = await supabase
      .from('simulation_participants')
      .select('*')
      .eq('simulation_id', simulationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create multiple participants for a simulation
  async createParticipants(simulationId: string, participants: ParticipantData[]): Promise<SimulationParticipant[]> {
    const participantsToInsert: SimulationParticipantInsert[] = participants.map(p => ({
      simulation_id: simulationId,
      first_name: p.firstName,
      last_name: p.lastName,
      email: p.email,
      phone: p.phone || null,
      participant_designation: p.participantDesignation,
    }));

    const { data, error } = await supabase
      .from('simulation_participants')
      .insert(participantsToInsert)
      .select();

    if (error) throw error;
    return data || [];
  },

  // Update a specific participant
  async updateParticipant(participantId: string, updates: Partial<ParticipantData>): Promise<void> {
    const updateData: Partial<SimulationParticipantInsert> = {};
    
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.participantDesignation !== undefined) updateData.participant_designation = updates.participantDesignation;

    const { error } = await supabase
      .from('simulation_participants')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', participantId);

    if (error) throw error;
  },

  // Delete a participant
  async deleteParticipant(participantId: string): Promise<void> {
    const { error } = await supabase
      .from('simulation_participants')
      .delete()
      .eq('id', participantId);

    if (error) throw error;
  },

  // Delete all participants for a simulation
  async deleteAllParticipants(simulationId: string): Promise<void> {
    const { error } = await supabase
      .from('simulation_participants')
      .delete()
      .eq('simulation_id', simulationId);

    if (error) throw error;
  },

  // Validate participant data
  validateParticipant(participant: ParticipantData): string[] {
    const errors: string[] = [];

    if (!participant.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!participant.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!participant.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participant.email)) {
      errors.push('Valid email is required');
    }

    if (participant.phone && !/^[\d\s\-\+\(\)]+$/.test(participant.phone)) {
      errors.push('Valid phone number is required');
    }

    return errors;
  }
};