
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
    
    // Load all participants in parallel instead of sequentially
    const participantPromises = simulationsData.map(async (simulation) => {
      try {
        console.log('👥 [BROKERAGE SIMULATIONS] Loading participants for simulation:', simulation.id);
        return await simulationParticipantService.getSimulationParticipants(simulation.id);
      } catch (error) {
        console.error(`❌ [BROKERAGE SIMULATIONS] Error loading participants for simulation ${simulation.id}:`, error);
        return []; // Return empty array for failed requests
      }
    });

    const participantResults = await Promise.all(participantPromises);
    const allParticipants = participantResults.flat();
    
    console.log('✅ [BROKERAGE SIMULATIONS] Loaded', allParticipants.length, 'participants total');
    return allParticipants;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        navigate('/auth');
        return;
      }

      try {
        setLoading(true);
        console.log('🚀 [BROKERAGE SIMULATIONS] Starting data load for user:', user.id);
        
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
        setSimulations(simulationsData);
        console.log('✅ [BROKERAGE SIMULATIONS] Loaded', simulationsData.length, 'simulations');

        // Load all participants in parallel (improved performance)
        if (simulationsData.length > 0) {
          const allParticipants = await loadParticipantsInParallel(simulationsData);
          setParticipants(allParticipants);
        }

        console.log('✅ [BROKERAGE SIMULATIONS] Data loading completed successfully');
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

  const handleCreateSimulation = async (simulationData: any) => {
    if (!brokerage) return;

    console.log('🚀 [BROKERAGE SIMULATIONS] Creating simulation:', simulationData.name);
    
    try {
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

      console.log('✅ [BROKERAGE SIMULATIONS] Simulation creation result:', result);

      // Reload data after creation (using parallel loading)
      console.log('🔄 [BROKERAGE SIMULATIONS] Reloading data after creation...');
      const simulationsData = await simulationService.getBrokerageSimulations(brokerage.id);
      setSimulations(simulationsData);

      // Reload participants in parallel
      const allParticipants = await loadParticipantsInParallel(simulationsData);
      setParticipants(allParticipants);
      
      // Show appropriate success message
      if (result.formLinksGenerated) {
        toast({
          title: "Simulation Created Successfully",
          description: `${simulationData.name} has been created with all form links.`,
        });
      } else {
        toast({
          title: "Simulation Created",
          description: result.formLinkErrors 
            ? `${simulationData.name} has been created but some form links failed to generate.`
            : `${simulationData.name} has been created. Form links are being generated.`,
          variant: result.formLinkErrors ? "destructive" : "default",
        });
      }
    } catch (error) {
      console.error('❌ [BROKERAGE SIMULATIONS] Error creating simulation:', error);
      toast({
        title: "Error",
        description: "Failed to create simulation.",
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
            brokerageId={brokerage.id}
            onCreateSimulation={handleCreateSimulation}
            onDeleteSimulation={handleDeleteSimulation}
            onOpenSimulation={handleOpenSimulation}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BrokerageSimulations;
