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

// Enhanced progress tracking interface
interface CreationProgress {
  step: string;
  message: string;
  progress: number;
  formLinksStatus?: 'completed' | 'pending' | 'partial' | 'failed';
}

const BrokerageSimulations = () => {
  const { brokerageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [brokerage, setBrokerage] = useState<Brokerage | null>(null);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [participants, setParticipants] = useState<SimulationParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState<CreationProgress | undefined>();

  // Enhanced parallel participant loading with better error handling
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

  // Enhanced simulation creation handler with optimistic updates and detailed progress
  const handleCreateSimulation = async (simulationData: any) => {
    if (!brokerage) return;

    console.log('🚀 [BROKERAGE SIMULATIONS] Creating simulation with enhanced handling:', simulationData.name);
    
    setIsCreating(true);
    setCreationProgress({
      step: 'Initializing',
      message: 'Preparing simulation creation...',
      progress: 10
    });

    try {
      // Step 1: Creating simulation
      setCreationProgress({
        step: 'Creating Simulation',
        message: 'Setting up simulation structure...',
        progress: 30
      });

      const result = await simulationService.createSimulationWithSetup({
        name: simulationData.name,
        description: simulationData.description,
        brokerageId: brokerage.id,
        applicantCount: simulationData.applicantCount,
        projectContactName: simulationData.projectContactName,
        projectContactEmail: simulationData.projectContactEmail,  
        projectContactPhone: simulationData.projectContactPhone,
        participants: simulationData.participants,
      });

      console.log('✅ [BROKERAGE SIMULATIONS] Enhanced simulation creation result:', result);

      // Step 2: Update progress based on result
      setCreationProgress({
        step: result.formLinksStatus === 'completed' ? 'Completed' : 'Processing Form Links',
        message: result.message || 'Simulation created successfully',
        progress: result.formLinksStatus === 'completed' ? 100 : 80,
        formLinksStatus: result.formLinksStatus
      });

      // Step 3: Optimized data reloading - only if creation was successful
      if (result.success) {
        console.log('🔄 [BROKERAGE SIMULATIONS] Performing optimized data reload...');
        
        setCreationProgress(prev => prev ? {
          ...prev,
          step: 'Refreshing Data',
          message: 'Loading updated simulation list...',
          progress: 90
        } : undefined);

        // Load simulations and participants in parallel for better performance
        const [simulationsData, allParticipants] = await Promise.all([
          simulationService.getBrokerageSimulations(brokerage.id),
          // Reload participants for all simulations including the new one
          (async () => {
            const updatedSimulations = await simulationService.getBrokerageSimulations(brokerage.id);
            return loadParticipantsInParallel(updatedSimulations || []);
          })()
        ]);

        setSimulations(simulationsData || []);
        setParticipants(allParticipants);
        
        // Final progress update
        setCreationProgress({
          step: 'Complete',
          message: result.message || 'Simulation created successfully',
          progress: 100,
          formLinksStatus: result.formLinksStatus
        });

        // Enhanced success messaging based on form links status
        const getToastConfig = (formLinksStatus: string) => {
          switch (formLinksStatus) {
            case 'completed':
              return {
                title: "Simulazione Creata con Successo",
                description: `${simulationData.name} è stata creata con tutti i link dei form.`,
                variant: "default" as const
              };
            case 'pending':
              return {
                title: "Simulazione Creata",
                description: `${simulationData.name} è stata creata. I link dei form sono in generazione.`,
                variant: "default" as const
              };
            case 'partial':
              return {
                title: "Simulazione Creata",
                description: `${simulationData.name} è stata creata. Alcuni link dei form sono in attesa - puoi riprovare più tardi.`,
                variant: "default" as const
              };
            case 'failed':
              return {
                title: "Simulazione Creata",
                description: `${simulationData.name} è stata creata. La generazione dei link dei form è fallita - puoi riprovare più tardi.`,
                variant: "default" as const
              };
            default:
              return {
                title: "Simulazione Creata",
                description: `${simulationData.name} è stata creata.`,
                variant: "default" as const
              };
          }
        };

        const toastConfig = getToastConfig(result.formLinksStatus);
        toast({
          title: toastConfig.title,
          description: toastConfig.description,
          variant: toastConfig.variant,
        });

        // Clear progress after a delay to show completion
        setTimeout(() => {
          setCreationProgress(undefined);
          setIsCreating(false);
        }, 2000);
      } else {
        toast({
          title: "Errore Parziale",
          description: "La simulazione potrebbe non essere stata creata completamente.",
          variant: "destructive",
        });
        setIsCreating(false);
        setCreationProgress(undefined);
      }
    } catch (error) {
      console.error('❌ [BROKERAGE SIMULATIONS] Error creating simulation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      
      setCreationProgress({
        step: 'Error',
        message: `Errore: ${errorMessage}`,
        progress: 0
      });
      
      toast({
        title: "Errore di Creazione",
        description: `Impossibile creare la simulazione: ${errorMessage}`,
        variant: "destructive",
      });

      setTimeout(() => {
        setIsCreating(false);
        setCreationProgress(undefined);
      }, 3000);
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
            onCreateSimulation={handleCreateSimulation}
            onDeleteSimulation={handleDeleteSimulation}
            onOpenSimulation={handleOpenSimulation}
            isCreating={isCreating}
            creationProgress={creationProgress}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BrokerageSimulations;
