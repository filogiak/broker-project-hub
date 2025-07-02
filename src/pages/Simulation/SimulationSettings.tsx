
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import SimulationSidebar from '@/components/simulation/SimulationSidebar';
import SimulationHeaderCard from '@/components/simulation/SimulationHeaderCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, Trash2 } from 'lucide-react';
import { useSimulationData } from '@/hooks/useSimulationData';
import { useAuth } from '@/hooks/useAuth';

const SimulationSettings = () => {
  const { simulationId } = useParams();
  const { user } = useAuth();
  const { data: simulation, isLoading, error } = useSimulationData(simulationId || '');

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
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-900">Elimina Simulazione</h4>
                    <p className="text-sm text-red-700">
                      Questa azione eliminerà permanentemente la simulazione e tutti i dati associati.
                    </p>
                  </div>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Elimina
                  </Button>
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
