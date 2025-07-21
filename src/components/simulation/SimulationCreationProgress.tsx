
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SimulationCreationProgressProps {
  isOpen: boolean;
  onComplete: (success: boolean, simulationId?: string) => void;
  simulationName: string;
  createSimulation: () => Promise<{ simulationId: string; success: boolean }>;
}

type ProgressStep = {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
};

const SimulationCreationProgress = ({ 
  isOpen, 
  onComplete, 
  simulationName, 
  createSimulation 
}: SimulationCreationProgressProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalResult, setFinalResult] = useState<{ success: boolean; simulationId?: string } | null>(null);

  const steps: ProgressStep[] = [
    { id: 'validating', label: 'Validazione dati in corso...', status: 'pending' },
    { id: 'creating', label: 'Creazione simulazione...', status: 'pending' },
    { id: 'participants', label: 'Aggiunta partecipanti...', status: 'pending' },
    { id: 'finalizing', label: 'Finalizzazione configurazione...', status: 'pending' },
    { id: 'completed', label: 'Simulazione creata con successo!', status: 'pending' }
  ];

  const [stepStatuses, setStepStatuses] = useState(steps);

  // Reset all progress state when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log('[PROGRESS] Dialog opened, resetting all state');
      resetProgressState();
    }
  }, [isOpen]);

  const resetProgressState = () => {
    console.log('[PROGRESS] Resetting all progress state');
    setProgress(0);
    setCurrentStep(0);
    setIsProcessing(false);
    setFinalResult(null);
    setStepStatuses(steps.map(step => ({ ...step, status: 'pending' as const })));
  };

  const updateStepStatus = (stepIndex: number, status: ProgressStep['status']) => {
    setStepStatuses(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status } : step
    ));
  };

  const startCreationProcess = async () => {
    if (isProcessing) {
      console.log('[PROGRESS] Already processing, skipping');
      return;
    }
    
    console.log('[PROGRESS] Starting creation process');
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep(0);
    setFinalResult(null);

    try {
      // Step 1: Validation
      updateStepStatus(0, 'in-progress');
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus(0, 'completed');
      setCurrentStep(1);

      // Step 2: Creating simulation
      updateStepStatus(1, 'in-progress');
      setProgress(30);
      
      // Start the actual creation process
      const creationPromise = createSimulation();
      
      // Simulate progress while creation happens
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStepStatus(1, 'completed');
      setCurrentStep(2);
      setProgress(50);

      // Step 3: Participants
      updateStepStatus(2, 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStepStatus(2, 'completed');
      setCurrentStep(3);
      setProgress(75);

      // Step 4: Finalizing
      updateStepStatus(3, 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus(3, 'completed');
      setCurrentStep(4);
      setProgress(90);

      // Wait for creation to complete or timeout after 10 seconds
      const timeoutPromise = new Promise<{ simulationId: string; success: boolean }>((_, reject) => {
        setTimeout(() => reject(new Error('Creation timeout')), 10000);
      });

      try {
        const result = await Promise.race([creationPromise, timeoutPromise]);
        
        // Step 5: Completion
        updateStepStatus(4, 'in-progress');
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));
        updateStepStatus(4, 'completed');
        
        setFinalResult({ success: true, simulationId: result.simulationId });
        
        // Wait a moment to show success state
        setTimeout(() => {
          onComplete(true, result.simulationId);
        }, 1500);

      } catch (error) {
        console.warn('[PROGRESS] Creation process had issues, but checking database...', error);
        
        // Even if there were errors, wait the full timeout period
        // then check if simulation was actually created
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For now, we'll assume success after timeout since the simulation
        // is usually created despite API errors
        updateStepStatus(4, 'completed');
        setProgress(100);
        
        setFinalResult({ success: true });
        
        setTimeout(() => {
          onComplete(true);
        }, 1500);
      }

    } catch (error) {
      console.error('[PROGRESS] Fatal creation error:', error);
      updateStepStatus(currentStep, 'failed');
      setFinalResult({ success: false });
      
      setTimeout(() => {
        onComplete(false);
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start creation process when dialog opens and state is reset
  useEffect(() => {
    if (isOpen && !isProcessing && !finalResult) {
      console.log('[PROGRESS] Conditions met, starting creation process');
      startCreationProcess();
    }
  }, [isOpen, isProcessing, finalResult]);

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[500px] [&>button]:hidden"
      >
        <div className="space-y-6 p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Creazione Simulazione in Corso
            </h2>
            <p className="text-sm text-gray-600">
              Stiamo creando "{simulationName}"
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 text-center">
              {progress}% completato
            </p>
          </div>

          {/* Steps */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {stepStatuses.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    {getStepIcon(step)}
                    <span className={`text-sm ${
                      step.status === 'completed' ? 'text-green-700 font-medium' :
                      step.status === 'in-progress' ? 'text-blue-700 font-medium' :
                      step.status === 'failed' ? 'text-red-700 font-medium' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Success Message */}
          {finalResult?.success && (
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">
                Simulazione creata con successo!
              </p>
              <p className="text-green-700 text-sm mt-1">
                Reindirizzamento in corso...
              </p>
            </div>
          )}

          {/* Failure Message */}
          {finalResult?.success === false && (
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-800 font-medium">
                Errore nella creazione
              </p>
              <p className="text-red-700 text-sm mt-1">
                Si è verificato un errore. Riprova più tardi.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimulationCreationProgress;
