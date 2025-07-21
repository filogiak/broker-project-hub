import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check, User, UserPlus, CheckCircle, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { simulationService, type SimulationCreationResult } from '@/services/simulationService';
import { simulationParticipantService, type ParticipantData } from '@/services/simulationParticipantService';
import SimulationCreationProgress from './SimulationCreationProgress';
import type { Database } from '@/integrations/supabase/types';

type ApplicantCount = Database['public']['Enums']['applicant_count'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

interface SimulationCreationData {
  name: string;
  description: string;
  applicantCount: ApplicantCount;
  participants: ParticipantData[];
}

interface SimulationCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  brokerageId: string;
  onSimulationCreated: () => void;
}

const APPLICANT_COUNT_LABELS: Record<ApplicantCount, string> = {
  one_applicant: 'Un Richiedente',
  two_applicants: 'Due Richiedenti',
  three_or_more_applicants: 'Tre o Più Richiedenti'
};

const PARTICIPANT_DESIGNATION_LABELS = {
  solo_applicant: 'Richiedente Unico',
  applicant_one: 'Primo Richiedente',
  applicant_two: 'Secondo Richiedente'
};

const SimulationCreationWizard = ({ isOpen, onClose, brokerageId, onSimulationCreated }: SimulationCreationWizardProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showProgress, setShowProgress] = useState(false);
  const [creationData, setCreationData] = useState<SimulationCreationData>({
    name: '',
    description: '',
    applicantCount: 'one_applicant',
    participants: [{
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      participantDesignation: 'solo_applicant'
    }]
  });

  const totalSteps = 4;

  const generateParticipants = (count: ApplicantCount): ParticipantData[] => {
    const designations: ParticipantDesignation[] = 
      count === 'one_applicant' 
        ? ['solo_applicant']
        : ['applicant_one', 'applicant_two'];

    return designations.map(designation => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      participantDesignation: designation
    }));
  };

  const handleApplicantCountChange = (count: ApplicantCount) => {
    setCreationData(prev => ({
      ...prev,
      applicantCount: count,
      participants: generateParticipants(count)
    }));
  };

  const handleParticipantChange = (index: number, field: keyof ParticipantData, value: string) => {
    setCreationData(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createSimulation = async (): Promise<{ simulationId: string; success: boolean }> => {
    console.log('[WIZARD] Starting simulation creation process');

    const primaryParticipant = creationData.participants.find(p => 
      p.participantDesignation === 'applicant_one' || p.participantDesignation === 'solo_applicant'
    );

    if (!primaryParticipant) {
      throw new Error('Nessun partecipante principale trovato');
    }

    const result = await simulationService.createSimulationWithSetup({
      name: creationData.name.trim(),
      description: creationData.description?.trim(),
      brokerageId: brokerageId,
      applicantCount: creationData.applicantCount,
      projectContactName: `${primaryParticipant.firstName} ${primaryParticipant.lastName}`,
      projectContactEmail: primaryParticipant.email,
      projectContactPhone: primaryParticipant.phone || '',
      participants: creationData.participants
    });

    if (!result.success || !result.simulationId) {
      throw new Error(result.message || 'Errore nella creazione della simulazione');
    }

    return { simulationId: result.simulationId, success: true };
  };

  const handleSubmit = () => {
    console.log('[WIZARD] Starting creation flow with progress screen');
    setShowProgress(true);
  };

  const handleCreationComplete = (success: boolean, simulationId?: string) => {
    console.log('[WIZARD] Creation completed:', { success, simulationId });
    
    setShowProgress(false);
    
    if (success) {
      // Call the parent callback to refresh the simulations list
      onSimulationCreated();
      
      // Close the wizard
      handleClose();
      
      toast({
        title: "Simulazione Creata",
        description: `${creationData.name} è stata creata con successo.`,
      });
    } else {
      toast({
        title: "Errore di Creazione",
        description: "Impossibile creare la simulazione. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (!showProgress) {
      setCurrentStep(1);
      setCreationData({
        name: '',
        description: '',
        applicantCount: 'one_applicant',
        participants: [{
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          participantDesignation: 'solo_applicant'
        }]
      });
      onClose();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return creationData.name.trim().length > 0;
      case 2:
        return true;
      case 3:
        return creationData.participants.every(p => 
          p.firstName.trim().length > 0 && 
          p.lastName.trim().length > 0 && 
          p.email.trim().length > 0
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Dettagli Simulazione</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fornisci le informazioni di base per la nuova simulazione.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Simulazione *</Label>
                <Input
                  id="name"
                  value={creationData.name}
                  onChange={(e) => setCreationData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Inserisci il nome della simulazione"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={creationData.description}
                  onChange={(e) => setCreationData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrivi la simulazione..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Numero di Richiedenti</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Quanti richiedenti parteciperanno a questa simulazione mutuo?
              </p>
            </div>
            <div className="space-y-2">
              <Label>Numero Richiedenti *</Label>
              <Select
                value={creationData.applicantCount}
                onValueChange={(value) => handleApplicantCountChange(value as ApplicantCount)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPLICANT_COUNT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Informazioni Partecipanti</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Inserisci i dettagli per ogni partecipante alla simulazione.
              </p>
            </div>
            <div className="space-y-4">
              {creationData.participants.map((participant, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {PARTICIPANT_DESIGNATION_LABELS[participant.participantDesignation]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input
                          value={participant.firstName}
                          onChange={(e) => handleParticipantChange(index, 'firstName', e.target.value)}
                          placeholder="Inserisci il nome"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cognome *</Label>
                        <Input
                          value={participant.lastName}
                          onChange={(e) => handleParticipantChange(index, 'lastName', e.target.value)}
                          placeholder="Inserisci il cognome"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={participant.email}
                        onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                        placeholder="Inserisci l'indirizzo email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefono</Label>
                      <Input
                        type="tel"
                        value={participant.phone}
                        onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                        placeholder="Inserisci il numero di telefono"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 4:
        const primaryParticipant = creationData.participants.find(p => 
          p.participantDesignation === 'applicant_one' || p.participantDesignation === 'solo_applicant'
        );
        
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Conferma e Crea</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Rivedi la configurazione della simulazione prima di completare.
              </p>
            </div>
            
            <Card className="bg-accent/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Riepilogo Simulazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{creationData.name}</span>
                </div>
                {creationData.description && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descrizione:</span>
                    <span className="font-medium">{creationData.description}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Richiedenti:</span>
                  <Badge variant="secondary">
                    {APPLICANT_COUNT_LABELS[creationData.applicantCount]}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Contatto Progetto:</span>
                  <div className="text-sm space-y-1 pl-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {primaryParticipant ? `${primaryParticipant.firstName} ${primaryParticipant.lastName}` : 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">📧</span>
                      {primaryParticipant?.email || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Partecipanti:</span>
                  <div className="text-sm space-y-1 pl-2">
                    {creationData.participants.map((participant, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <UserPlus className="h-3 w-3" />
                        {participant.firstName} {participant.lastName} ({participant.email})
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showProgress} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crea Nuova Simulazione</DialogTitle>
            <DialogDescription>
              Passo {currentStep} di {totalSteps}: Configura la tua simulazione
            </DialogDescription>
          </DialogHeader>

          {/* Progress indicator */}
          <div className="flex items-center space-x-2 mb-6">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i + 1 <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {i + 1 <= currentStep ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`w-8 h-0.5 ${
                      i + 1 < currentStep ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="bg-form-green hover:bg-form-green-dark text-white"
              >
                Avanti
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid()}
                className="bg-form-green hover:bg-form-green-dark text-white"
              >
                Crea Simulazione
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Screen */}
      <SimulationCreationProgress
        isOpen={showProgress}
        onComplete={handleCreationComplete}
        simulationName={creationData.name}
        createSimulation={createSimulation}
      />
    </>
  );
};

export default SimulationCreationWizard;
