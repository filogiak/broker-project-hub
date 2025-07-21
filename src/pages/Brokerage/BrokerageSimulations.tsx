import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { simulationService } from '@/services/simulationService';
import { simulationParticipantService } from '@/services/simulationParticipantService';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import BrokerageSidebar from '@/components/brokerage/BrokerageSidebar';
import SimulationsFullSection from '@/components/brokerage/SimulationsFullSection';
import { useAuth } from '@/hooks/useAuth';
import { getBrokerageByAccess } from '@/services/brokerageService';
import type { Database } from '@/integrations/supabase/types';

type Simulation = Database['public']['Tables']['simulations']['Row'];
type SimulationParticipant = Database['public']['Tables']['simulation_participants']['Row'];
type Brokerage = Database['public']['Tables']['brokerages']['Row'];

const BrokerageSimulations = () => {
  const { brokerageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [brokerage, setBrokerage] = useState<Brokerage | null>(null);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [participants, setParticipants] = useState<SimulationParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParticipantsInParallel = async (simulationsData: Simulation[]) => {
    console.log('👥 [BROKERAGE SIMULATIONS] Loading participants for', simulationsData.length, 'simulations in parallel');
    
    if (!simulationsData || simulationsData.length === 0) {
      console.log('👥 [BROKERAGE SIMULATIONS] No simulations to load participants for');
      return [];
    }
    
    // Load all participants in parallel with enhanced error handling
    const participantPromises = simulationsData.map(async (simulation) => {
      try {
        console.log('👥 [BROKERAGE SIMULATIONS] Loading participants for simulation:', simulation.id);
        const simulationParticipants = await simulationParticipantService.getSimulationParticipants(simulation.id);
        return simulationParticipants || [];
      } catch (error) {
        console.error(`❌ [BROKERAGE SIMULATIONS] Error loading participants for simulation ${simulation.id}:`, error);
        return []; // Return empty array for failed requests to prevent Promise.all failure
      }
    });

    try {
      const participantResults = await Promise.allSettled(participantPromises);
      const allParticipants = participantResults
        .filter((result): result is PromiseFulfilledResult<SimulationParticipant[]> => result.status === 'fulfilled')
        .map(result => result.value)
        .flat();
      
      console.log('✅ [BROKERAGE SIMULATIONS] Loaded', allParticipants.length, 'participants total');
      return allParticipants;
    } catch (error) {
      console.error('❌ [BROKERAGE SIMULATIONS] Error in parallel participant loading:', error);
      return [];
    }
  };

  // CENTRALIZED data reload function - this is what fixes the refresh issue
  const reloadSimulationData = async () => {
    if (!brokerage) return;
    
    try {
      console.log('🔄 [BROKERAGE SIMULATIONS] Reloading simulation data...');
      
      // Load simulations and participants in parallel for better performance
      const [simulationsData, allParticipants] = await Promise.all([
        simulationService.getBrokerageSimulations(brokerage.id),
        (async () => {
          const updatedSimulations = await simulationService.getBrokerageSimulations(brokerage.id);
          return loadParticipantsInParallel(updatedSimulations || []);
        })()
      ]);

      setSimulations(simulationsData || []);
      setParticipants(allParticipants);
      
      console.log('✅ [BROKERAGE SIMULATIONS] Data reloaded successfully');
    } catch (error) {
      console.error('❌ [BROKERAGE SIMULATIONS] Error reloading data:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        navigate('/auth');
        return;
      }

      try {
        setLoading(true);
        console.log('🚀 [BROKERAGE SIMULATIONS] Starting enhanced data load for user:', user.id);
        
        // Load brokerage using the access logic
        console.log('🏢 [BROKERAGE SIMULATIONS] Loading brokerage data...');
        const brokerageData = await getBrokerageByAccess(user.id);
        if (!brokerageData || brokerageData.id !== brokerageId) {
          console.warn('❌ [BROKERAGE SIMULATIONS] Access denied for brokerage:', brokerageId);
          toast({
            title: "Access Denied",
            description: "You don't have access to this brokerage.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }
        setBrokerage(brokerageData);
        console.log('✅ [BROKERAGE SIMULATIONS] Brokerage data loaded:', brokerageData.name);

        // Load simulations for this brokerage
        console.log('📊 [BROKERAGE SIMULATIONS] Loading simulations...');
        const simulationsData = await simulationService.getBrokerageSimulations(brokerageData.id);
        setSimulations(simulationsData || []);
        console.log('✅ [BROKERAGE SIMULATIONS] Loaded', simulationsData?.length || 0, 'simulations');

        // Load all participants in parallel (enhanced with better error handling)
        if (simulationsData && simulationsData.length > 0) {
          const allParticipants = await loadParticipantsInParallel(simulationsData);
          setParticipants(allParticipants);
        } else {
          setParticipants([]);
        }

        console.log('✅ [BROKERAGE SIMULATIONS] Enhanced data loading completed successfully');
      } catch (error) {
        console.error('❌ [BROKERAGE SIMULATIONS] Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load simulations data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, brokerageId, navigate, toast]);

  const handleRetryFormLinks = async (simulationId: string) => {
    console.log('🔄 [BROKERAGE SIMULATIONS] Retrying form link generation for:', simulationId);
    
    try {
      const result = await simulationService.retryFormLinkGeneration(simulationId);
      
      if (result.success) {
        toast({
          title: "Link dei Form Rigenerati",
          description: "I link dei form sono stati generati con successo.",
        });
        // Reload data to reflect any changes
        await reloadSimulationData();
      } else {
        toast({
          title: "Errore Rigenerazione",
          description: result.errors?.join(', ') || "Impossibile rigenerare i link dei form",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ [BROKERAGE SIMULATIONS] Error retrying form links:', error);
      toast({
        title: "Errore",
        description: "Impossibile rigenerare i link dei form.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSimulation = async (simulationId: string) => {
    console.log('🗑️ [BROKERAGE SIMULATIONS] Deleting simulation:', simulationId);
    
    try {
      const result = await simulationService.deleteSimulation(simulationId);
      if (result.success) {
        setSimulations(prev => prev.filter(simulation => simulation.id !== simulationId));
        setParticipants(prev => prev.filter(participant => participant.simulation_id !== simulationId));
        
        console.log('✅ [BROKERAGE SIMULATIONS] Simulation deleted successfully');
        toast({
          title: "Simulation Deleted",
          description: "Simulation has been deleted successfully.",
        });
      } else {
        throw new Error(result.error || 'Failed to delete simulation');
      }
    } catch (error) {
      console.error('❌ [BROKERAGE SIMULATIONS] Error deleting simulation:', error);
      toast({
        title: "Error",
        description: "Failed to delete simulation.",
        variant: "destructive",
      });
    }
  };

  const handleOpenSimulation = (simulationId: string) => {
    console.log('🔗 [BROKERAGE SIMULATIONS] Opening simulation:', simulationId);
    navigate(`/simulation/${simulationId}`);
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <BrokerageSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-lg text-form-green font-dm-sans">Loading...</div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!brokerage) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <BrokerageSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 text-destructive font-dm-sans">
                  No Brokerage Found
                </h2>
                <p className="text-muted-foreground font-dm-sans">
                  You don't have access to this brokerage.
                </p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <BrokerageSidebar />
        <SidebarInset>
          <SimulationsFullSection
            simulations={simulations}
            participants={participants}
            brokerageId={brokerage?.id || ''}
            onDeleteSimulation={handleDeleteSimulation}
            onOpenSimulation={handleOpenSimulation}
            onRetryFormLinks={handleRetryFormLinks}
            onReloadData={reloadSimulationData} // Pass the centralized reload function
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BrokerageSimulations;
