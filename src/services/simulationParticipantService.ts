
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SimulationParticipant = Database['public']['Tables']['simulation_participants']['Row'];
type SimulationParticipantInsert = Database['public']['Tables']['simulation_participants']['Insert'];

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
  async createParticipants(simulationId: string, participants: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    participantDesignation: Database['public']['Enums']['participant_designation'];
  }>): Promise<SimulationParticipant[]> {
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

  // Update a participant
  async updateParticipant(participantId: string, updates: Partial<SimulationParticipantInsert>): Promise<void> {
    const { error } = await supabase
      .from('simulation_participants')
      .update({ ...updates, updated_at: new Date().toISOString() })
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
};
