
import React, { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import SimulationSidebar from '@/components/simulation/SimulationSidebar';
import SimulationHeaderCard from '@/components/simulation/SimulationHeaderCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Save, Trash2 } from 'lucide-react';
import { useSimulationData } from '@/hooks/useSimulationData';
import { useAuth } from '@/hooks/useAuth';
import { simulationService } from '@/services/simulationService';
import { useToast } from '@/hooks/use-toast';

const SimulationSettings = () => {
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: simulation, isLoading, error } = useSimulationData(simulationId || '');
  const { toast } = useToast();
  const [confirmationName, setConfirmationName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!simulationId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <SimulationSidebar />
          <SidebarInset>
            <div className="flex-1 p-8">
              <div className="animate-pulse space-y-6">
                <div className="bg-white border border-[#BEB8AE] rounded-[12px] p-6">
                  <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-96"></div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !simulation) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <SimulationSidebar />
          <SidebarInset>
            <div className="flex-1 p-8">
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Simulazione non trovata
                </h2>
                <p className="text-gray-600">
                  La simulazione richiesta non esiste o non hai i permessi per visualizzarla.
                </p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  const handleDeleteSimulation = async () => {
    if (confirmationName !== simulation.name) {
      toast({
        title: "Nome non corrispondente",
        description: "Digita esattamente il nome della simulazione per confermare l'eliminazione.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const result = await simulationService.deleteSimulation(simulation.id);
      
      if (result.success) {
        toast({
          title: "Simulazione eliminata",
          description: `${result.simulationName} e ${result.deletedMembers || 0} membri, ${result.deletedInvitations || 0} inviti sono stati eliminati.`,
        });
        navigate(`/brokerage/${simulation.brokerage_id}/simulations`);
      } else {
        toast({
          title: "Errore nell'eliminazione",
          description: result.error || "Si è verificato un errore sconosciuto.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Errore nell'eliminazione",
        description: "Impossibile eliminare la simulazione. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setConfirmationName('');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SimulationSidebar />
        <SidebarInset>
          <div className="flex-1 p-8 space-y-8">
            <SimulationHeaderCard simulation={simulation} />

            {/* General Settings */}
            <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
              <CardHeader>
                <CardTitle className="font-dm-sans text-xl text-black">
                  Impostazioni Generali
                </CardTitle>
                <CardDescription className="font-dm-sans">
                  Configura le impostazioni base della simulazione
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Simulazione</Label>
                  <Input
                    id="name"
                    defaultValue={simulation.name}
                    placeholder="Inserisci il nome della simulazione"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    defaultValue={simulation.description || ''}
                    placeholder="Descrivi la simulazione..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Stato</Label>
                  <Select defaultValue={simulation.status}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona lo stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bozza</SelectItem>
                      <SelectItem value="in_progress">In Corso</SelectItem>
                      <SelectItem value="completed">Completata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="bg-form-green hover:bg-form-green-hover text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Salva Modifiche
                  </Button>
                  <Button variant="outline">
                    Annulla
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
              <CardHeader>
                <CardTitle className="font-dm-sans text-xl text-black">
                  Impostazioni Avanzate
                </CardTitle>
                <CardDescription className="font-dm-sans">
                  Configurazioni avanzate per la simulazione
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-form-green/10 flex items-center justify-center mx-auto mb-4">
                    <Settings className="h-8 w-8 text-form-green" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">Impostazioni Avanzate</h3>
                  <p className="text-gray-600">
                    Le impostazioni avanzate saranno disponibili nelle prossime versioni.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-white border border-red-200 rounded-[12px]">
              <CardHeader>
                <CardTitle className="font-dm-sans text-xl text-red-600">
                  Zona Pericolosa
                </CardTitle>
                <CardDescription className="font-dm-sans">
                  Azioni irreversibili sulla simulazione
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-red-50 rounded-lg space-y-4">
                  <div>
                    <h4 className="font-medium text-red-900">Elimina Simulazione</h4>
                    <p className="text-sm text-red-700 mb-2">
                      Questa azione eliminerà permanentemente:
                    </p>
                    <ul className="text-sm text-red-700 list-disc list-inside ml-4 space-y-1">
                      <li>La simulazione e tutti i suoi dati</li>
                      <li>Tutti i membri della simulazione</li>
                      <li>Tutti gli inviti in sospeso</li>
                    </ul>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina Simulazione
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <p>
                            Questa azione non può essere annullata. Eliminerà permanentemente la simulazione
                            <strong className="font-medium"> "{simulation.name}"</strong> e rimuoverà tutti i dati associati.
                          </p>
                          <p>Digita <strong className="font-medium">{simulation.name}</strong> per confermare:</p>
                          <Input
                            placeholder="Digita il nome della simulazione"
                            value={confirmationName}
                            onChange={(e) => setConfirmationName(e.target.value)}
                            className="mt-2"
                          />
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setConfirmationName('')}>
                          Annulla
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteSimulation}
                          disabled={confirmationName !== simulation.name || isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? "Eliminazione..." : "Elimina simulazione"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SimulationSettings;
