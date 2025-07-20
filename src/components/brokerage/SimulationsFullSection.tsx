import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Users, Calendar, CheckCircle, AlertCircle, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import SimulationCreationWizard from '@/components/simulation/SimulationCreationWizard';
import { simulationService } from '@/services/simulationService';
import type { Database } from '@/integrations/supabase/types';

type Simulation = Database['public']['Tables']['simulations']['Row'];
type SimulationParticipant = Database['public']['Tables']['simulation_participants']['Row'];

interface CreationProgress {
  step: string;
  message: string;
  progress: number;
  formLinksStatus?: 'completed' | 'pending' | 'partial' | 'failed';
}

interface SimulationsFullSectionProps {
  simulations: Simulation[];
  participants: SimulationParticipant[];
  brokerageId: string;
  onCreateSimulation: (simulationData: any) => Promise<void>;
  onDeleteSimulation: (simulationId: string) => Promise<void>;
  onOpenSimulation: (simulationId: string) => void;
  isCreating?: boolean;
  creationProgress?: CreationProgress;
}

const SimulationsFullSection: React.FC<SimulationsFullSectionProps> = ({
  simulations,
  participants,
  brokerageId,
  onCreateSimulation,
  onDeleteSimulation,
  onOpenSimulation,
  isCreating = false,
  creationProgress
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [retryingFormLinks, setRetryingFormLinks] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredSimulations = simulations.filter(simulation =>
    simulation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFormLinksStatus = (simulationId: string): 'completed' | 'pending' | 'partial' | 'failed' | 'unknown' => {
    // This would ideally come from the database - for now return unknown
    // In a real implementation, you'd track this in the simulation table
    return 'unknown';
  };

  const handleRetryFormLinks = async (simulationId: string, simulationName: string) => {
    setRetryingFormLinks(simulationId);
    
    try {
      console.log('🔄 [SIMULATIONS] Retrying form link generation for:', simulationName);
      
      const result = await simulationService.retryFormLinkGeneration(simulationId);
      
      if (result.success) {
        toast({
          title: "Link dei Form Generati",
          description: `I link dei form per "${simulationName}" sono stati generati con successo.`,
        });
      } else {
        toast({
          title: "Retry Fallito",
          description: result.errors?.[0] || 'Impossibile generare i link dei form. Riprova più tardi.',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ [SIMULATIONS] Error retrying form links:', error);
      toast({
        title: "Errore di Retry",
        description: "Errore durante il retry della generazione dei link dei form.",
        variant: "destructive",
      });
    } finally {
      setRetryingFormLinks(null);
    }
  };

  const getStatusBadge = (status: string, formLinksStatus?: string) => {
    const baseVariant = status === 'active' ? 'default' : 'secondary';
    
    if (formLinksStatus && formLinksStatus !== 'completed' && formLinksStatus !== 'unknown') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant={baseVariant}>{status}</Badge>
          <Badge variant={
            formLinksStatus === 'pending' ? 'secondary' :
            formLinksStatus === 'partial' ? 'destructive' :
            'destructive'
          }>
            {formLinksStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
            {formLinksStatus === 'partial' && <AlertCircle className="h-3 w-3 mr-1" />}
            {formLinksStatus === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
            Form Links {formLinksStatus}
          </Badge>
        </div>
      );
    }
    
    return <Badge variant={baseVariant}>{status}</Badge>;
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">Simulations</h1>
          <Badge variant="secondary">{simulations.length} Simulations</Badge>
        </div>

        <div className="flex items-center space-x-4">
          <Input
            type="text"
            placeholder="Search simulations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-64"
          />
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Simulation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Simulation</DialogTitle>
              </DialogHeader>
              <SimulationCreationWizard
                onCreateSimulation={async (data) => {
                  await onCreateSimulation(data);
                  setIsCreateModalOpen(false);
                }}
                isCreating={isCreating}
                creationProgress={creationProgress}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Simulations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSimulations.map((simulation) => {
          const simulationParticipants = participants.filter(p => p.simulation_id === simulation.id);
          const formLinksStatus = getFormLinksStatus(simulation.id);
          
          return (
            <Card key={simulation.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {simulation.name}
                    </CardTitle>
                    {getStatusBadge(simulation.status, formLinksStatus)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onOpenSimulation(simulation.id)}>
                        Open Simulation
                      </DropdownMenuItem>
                      {(formLinksStatus === 'partial' || formLinksStatus === 'failed') && (
                        <DropdownMenuItem 
                          onClick={() => handleRetryFormLinks(simulation.id, simulation.name)}
                          disabled={retryingFormLinks === simulation.id}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {retryingFormLinks === simulation.id ? 'Retrying...' : 'Retry Form Links'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onDeleteSimulation(simulation.id)}
                        className="text-red-600"
                      >
                        Delete Simulation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent onClick={() => onOpenSimulation(simulation.id)}>
                <div className="space-y-3">
                  {simulation.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {simulation.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{simulationParticipants.length} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(simulation.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Enhanced form links status indicator */}
                  {formLinksStatus && formLinksStatus !== 'unknown' && formLinksStatus !== 'completed' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <div className="flex items-center gap-2 text-sm">
                        {formLinksStatus === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                        {(formLinksStatus === 'partial' || formLinksStatus === 'failed') && <AlertCircle className="h-4 w-4 text-orange-600" />}
                        <span className="text-yellow-700 font-medium">
                          Form Links {formLinksStatus === 'pending' ? 'Generating' : 'Need Attention'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Creation Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Simulation</DialogTitle>
          </DialogHeader>
          <SimulationCreationWizard
            onCreateSimulation={async (data) => {
              await onCreateSimulation(data);
              setIsCreateModalOpen(false);
            }}
            isCreating={isCreating}
            creationProgress={creationProgress}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SimulationsFullSection;
