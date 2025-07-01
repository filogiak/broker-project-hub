
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { simulationService } from '@/services/simulationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Play, CheckCircle, Archive } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import BrokerageSidebar from '@/components/brokerage/BrokerageSidebar';
import type { Database } from '@/integrations/supabase/types';

type Simulation = Database['public']['Tables']['simulations']['Row'];

const BrokerageSimulations = () => {
  const { brokerageId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSimulation, setNewSimulation] = useState({
    name: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSimulations();
  }, [brokerageId]);

  const loadSimulations = async () => {
    if (!brokerageId) return;
    
    try {
      setLoading(true);
      const data = await simulationService.getBrokerageSimulations(brokerageId);
      setSimulations(data);
    } catch (error) {
      console.error('Error loading simulations:', error);
      toast({
        title: "Error",
        description: "Failed to load simulations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSimulation = async () => {
    if (!brokerageId || !newSimulation.name.trim()) return;

    try {
      setCreating(true);
      await simulationService.createSimulation({
        name: newSimulation.name,
        description: newSimulation.description,
        brokerageId
      });

      toast({
        title: "Success",
        description: "Simulation created successfully.",
      });

      setCreateModalOpen(false);
      setNewSimulation({ name: '', description: '' });
      loadSimulations();
    } catch (error) {
      console.error('Error creating simulation:', error);
      toast({
        title: "Error",
        description: "Failed to create simulation.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Archive className="h-4 w-4 text-gray-500" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Archive className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <BrokerageSidebar />
          <SidebarInset>
            <div className="flex-1 p-8">
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-[#BEB8AE] rounded-[12px] p-6 animate-pulse">
                    <div className="h-4 bg-form-placeholder rounded w-48 mb-2"></div>
                    <div className="h-3 bg-form-placeholder rounded w-32"></div>
                  </div>
                ))}
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
          <div className="flex-1 p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-semibold font-dm-sans text-3xl text-black mb-2">Simulazioni</h1>
                <p className="text-gray-600 font-dm-sans">
                  Crea e gestisci simulazioni per i tuoi clienti prima di trasformarle in progetti.
                </p>
              </div>
              
              <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-form-green hover:bg-form-green-dark text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Simulazione
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crea Nuova Simulazione</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome Simulazione</Label>
                      <Input
                        id="name"
                        value={newSimulation.name}
                        onChange={(e) => setNewSimulation(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Inserisci il nome della simulazione"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrizione (opzionale)</Label>
                      <Textarea
                        id="description"
                        value={newSimulation.description}
                        onChange={(e) => setNewSimulation(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descrivi la simulazione..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                        Annulla
                      </Button>
                      <Button 
                        onClick={handleCreateSimulation}
                        disabled={!newSimulation.name.trim() || creating}
                        className="bg-form-green hover:bg-form-green-dark text-white"
                      >
                        {creating ? 'Creando...' : 'Crea Simulazione'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {simulations.length === 0 ? (
              <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-form-green/10 flex items-center justify-center mx-auto mb-4">
                    <Play className="h-8 w-8 text-form-green" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">Nessuna simulazione trovata</h3>
                  <p className="text-gray-600 mb-6">
                    Inizia creando la tua prima simulazione per i clienti.
                  </p>
                  <Button 
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-form-green hover:bg-form-green-dark text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crea Prima Simulazione
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {simulations.map((simulation) => (
                  <Card 
                    key={simulation.id} 
                    className="bg-white border border-[#BEB8AE] rounded-[12px] cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/simulation/${simulation.id}`)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-dm-sans text-xl text-black mb-2">
                            {simulation.name}
                          </CardTitle>
                          {simulation.description && (
                            <p className="text-gray-600 text-sm">{simulation.description}</p>
                          )}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(simulation.status)}`}>
                          {getStatusIcon(simulation.status)}
                          {simulation.status === 'draft' && 'Bozza'}
                          {simulation.status === 'in_progress' && 'In Corso'}
                          {simulation.status === 'completed' && 'Completata'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          Creata il {new Date(simulation.created_at).toLocaleDateString('it-IT')}
                        </span>
                        <span>
                          Ultima modifica: {new Date(simulation.updated_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BrokerageSimulations;
