
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

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        navigate('/auth');
        return;
      }

      try {
        setLoading(true);
        
        // Load brokerage using the access logic
        const brokerageData = await getBrokerageByAccess(user.id);
        if (!brokerageData || brokerageData.id !== brokerageId) {
          toast({
            title: "Access Denied",
            description: "You don't have access to this brokerage.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }
        setBrokerage(brokerageData);

        // Load simulations for this brokerage
        const simulationsData = await simulationService.getBrokerageSimulations(brokerageData.id);
        setSimulations(simulationsData);

        // Load all participants for these simulations
        const allParticipants: SimulationParticipant[] = [];
        for (const simulation of simulationsData) {
          try {
            const simulationParticipants = await simulationParticipantService.getSimulationParticipants(simulation.id);
            allParticipants.push(...simulationParticipants);
          } catch (error) {
            console.error(`Error loading participants for simulation ${simulation.id}:`, error);
          }
        }
        setParticipants(allParticipants);
      } catch (error) {
        console.error('Error loading data:', error);
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

    try {
      await simulationService.createSimulationWithSetup({
        name: simulationData.name,
        description: simulationData.description,
        brokerageId: brokerage.id,
        applicantCount: simulationData.applicantCount,
        projectContactName: simulationData.projectContactName,
        projectContactEmail: simulationData.projectContactEmail,
        projectContactPhone: simulationData.projectContactPhone,
        participants: simulationData.participants,
      });

      // Reload data after creation
      const simulationsData = await simulationService.getBrokerageSimulations(brokerage.id);
      setSimulations(simulationsData);

      // Reload participants
      const allParticipants: SimulationParticipant[] = [];
      for (const simulation of simulationsData) {
        try {
          const simulationParticipants = await simulationParticipantService.getSimulationParticipants(simulation.id);
          allParticipants.push(...simulationParticipants);
        } catch (error) {
          console.error(`Error loading participants for simulation ${simulation.id}:`, error);
        }
      }
      setParticipants(allParticipants);
      
      toast({
        title: "Simulation Created Successfully",
        description: `${simulationData.name} has been created.`,
      });
    } catch (error) {
      console.error('Error creating simulation:', error);
      toast({
        title: "Error",
        description: "Failed to create simulation.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSimulation = async (simulationId: string) => {
    try {
      const result = await simulationService.deleteSimulation(simulationId);
      if (result.success) {
        setSimulations(prev => prev.filter(simulation => simulation.id !== simulationId));
        setParticipants(prev => prev.filter(participant => participant.simulation_id !== simulationId));
        toast({
          title: "Simulation Deleted",
          description: "Simulation has been deleted successfully.",
        });
      } else {
        throw new Error(result.error || 'Failed to delete simulation');
      }
    } catch (error) {
      console.error('Error deleting simulation:', error);
      toast({
        title: "Error",
        description: "Failed to delete simulation.",
        variant: "destructive",
      });
    }
  };

  const handleOpenSimulation = (simulationId: string) => {
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
