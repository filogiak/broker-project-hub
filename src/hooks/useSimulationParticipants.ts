import { useQuery } from '@tanstack/react-query';
import { simulationParticipantService } from '@/services/simulationParticipantService';
import type { Database } from '@/integrations/supabase/types';

type SimulationParticipant = Database['public']['Tables']['simulation_participants']['Row'];

export const useSimulationParticipants = (simulationId: string) => {
  return useQuery<SimulationParticipant[]>({
    queryKey: ['simulation-participants', simulationId],
    queryFn: async () => {
      if (!simulationId) throw new Error('Simulation ID is required');
      return simulationParticipantService.getSimulationParticipants(simulationId);
    },
    enabled: !!simulationId,
  });
};