
import React, { useState } from 'react';
import { Plus, FolderOpen, MoreVertical, Trash2, ExternalLink, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SimulationCreationWizard from '@/components/simulation/SimulationCreationWizard';
import { getParticipantDisplayNames } from '@/utils/simulationHelpers';
import type { Database } from '@/integrations/supabase/types';

type Simulation = Database['public']['Tables']['simulations']['Row'];
type SimulationParticipant = Database['public']['Tables']['simulation_participants']['Row'];

interface SimulationWithParticipants extends Simulation {
  participants?: SimulationParticipant[];
}

interface SimulationsFullSectionProps {
  simulations: SimulationWithParticipants[];
  participants: SimulationParticipant[];
  brokerageId: string;
  onCreateSimulation: (simulationData: any) => Promise<void>;
  onDeleteSimulation: (simulationId: string) => Promise<void>;
  onOpenSimulation: (simulationId: string) => void;
}

const SimulationsFullSection = ({ 
  simulations, 
  participants,
  brokerageId, 
  onCreateSimulation, 
  onDeleteSimulation, 
  onOpenSimulation 
}: SimulationsFullSectionProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [simulationToDelete, setSimulationToDelete] = useState<string | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleCreateSimulation = async (simulationData: any) => {
    await onCreateSimulation(simulationData);
    setIsCreateModalOpen(false);
  };

  const handleDeleteClick = (simulationId: string) => {
    setSimulationToDelete(simulationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (simulationToDelete) {
      await onDeleteSimulation(simulationToDelete);
      setDeleteDialogOpen(false);
      setSimulationToDelete(null);
    }
  };

  // Get participants for each simulation
  const getSimulationParticipants = (simulationId: string) => {
    return participants.filter(p => p.simulation_id === simulationId);
  };

  // Filter simulations based on search query
  const filteredSimulations = simulations.filter((simulation) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Get participant names for search
    const simulationParticipants = getSimulationParticipants(simulation.id);
    const { primaryParticipant, secondaryParticipant } = getParticipantDisplayNames(simulationParticipants);
    
    return (
      simulation.name?.toLowerCase().includes(query) ||
      simulation.description?.toLowerCase().includes(query) ||
      primaryParticipant?.toLowerCase().includes(query) ||
      (secondaryParticipant && secondaryParticipant.toLowerCase().includes(query))
    );
  });

  // Sort simulations by creation date (most recent first)
  const sortedSimulations = [...filteredSimulations].sort((a, b) => 
    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="bg-white rounded-[12px] shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center justify-between font-dm-sans text-black text-2xl font-semibold">
              Simulazioni Attive
              <span className="text-sm font-normal text-muted-foreground ml-4">
                {filteredSimulations.length} {filteredSimulations.length === 1 ? 'simulazione' : 'simulazioni'}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              {/* Search functionality */}
              <div className="flex items-center">
                {isSearchExpanded && (
                  <div className="flex items-center mr-2">
                    <Input
                      placeholder="Cerca simulazioni..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 h-10"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSearchToggle}
                      className="ml-1 p-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {!isSearchExpanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSearchToggle}
                    className="mr-2 p-2"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="gomutuo-button-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuova Simulazione
              </Button>
            </div>
          </div>

          {/* Simulations List */}
          {sortedSimulations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4 font-dm-sans">
                {searchQuery ? 'Nessuna simulazione trovata per la ricerca.' : 'Nessuna simulazione trovata.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedSimulations.map((simulation) => {
                const simulationParticipants = getSimulationParticipants(simulation.id);
                const { primaryParticipant, secondaryParticipant } = getParticipantDisplayNames(simulationParticipants);
                
                return (
                  <Card 
                    key={simulation.id} 
                    className="cursor-pointer bg-white border-2 border-form-green rounded-[12px] press-down-effect relative overflow-hidden"
                  >
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-form-green rounded-b-[10px]"></div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="h-9 w-9 text-form-green" />
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                          <div className="md:col-span-2">
                            <h3 className="font-semibold text-black font-dm-sans text-lg">
                              {simulation.name}
                            </h3>
                          </div>

                          <div className="text-left">
                            <p className="text-xs text-gray-500 mb-1">Richiedente</p>
                            <p className="font-medium text-form-green text-sm">
                              {primaryParticipant}
                            </p>
                          </div>

                          <div className="text-left">
                            <p className="text-xs text-gray-500 mb-1">Richiedente 2</p>
                            <p className="font-medium text-form-green text-sm">
                              {secondaryParticipant || '-'}
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Data Creazione</p>
                            <p className="font-medium text-form-green text-sm">{formatDate(simulation.created_at)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenSimulation(simulation.id)}
                            className="flex items-center gap-1 font-dm-sans"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Apri
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="p-2">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(simulation.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Elimina
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Create Simulation Wizard */}
          <SimulationCreationWizard
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            brokerageId={brokerageId}
            onSimulationCreated={() => handleCreateSimulation({})}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
                <AlertDialogDescription>
                  Sei sicuro di voler eliminare questa simulazione? Questa azione non può essere annullata.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                  Annulla
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default SimulationsFullSection;
