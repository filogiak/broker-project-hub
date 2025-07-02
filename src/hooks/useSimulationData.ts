
import { useQuery } from '@tanstack/react-query';
import { simulationService, type SimulationMemberWithProfile } from '@/services/simulationService';

export const useSimulationData = (simulationId: string) => {
  return useQuery({
    queryKey: ['simulation', simulationId],
    queryFn: async () => {
      if (!simulationId) throw new Error('Simulation ID is required');
      return simulationService.getSimulation(simulationId);
    },
    enabled: !!simulationId,
  });
};

export const useSimulationMembers = (simulationId: string) => {
  return useQuery<SimulationMemberWithProfile[]>({
    queryKey: ['simulation-members', simulationId],
    queryFn: async () => {
      if (!simulationId) throw new Error('Simulation ID is required');
      return simulationService.getSimulationMembers(simulationId);
    },
    enabled: !!simulationId,
  });
};
