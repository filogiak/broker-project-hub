import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check, UserPlus, Mail, Phone, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { simulationService } from '@/services/simulationService';
import { simulationParticipantService, type ParticipantData } from '@/services/simulationParticipantService';
import type { Database } from '@/integrations/supabase/types';

type ApplicantCount = Database['public']['Enums']['applicant_count'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

interface SimulationSetupData {
  applicantCount: ApplicantCount;
  projectContactName: string;
  projectContactEmail: string;
  projectContactPhone: string;
  participants: ParticipantData[];
}

interface SimulationSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  simulationId: string;
  simulationName: string;
  onSetupComplete: () => void;
}

const APPLICANT_COUNT_LABELS: Record<ApplicantCount, string> = {
  one_applicant: 'Single Applicant',
  two_applicants: 'Two Applicants',
  three_or_more_applicants: 'Three or More Applicants'
};

const PARTICIPANT_DESIGNATION_LABELS = {
  solo_applicant: 'Solo Applicant',
  applicant_one: 'Primary Applicant',
  applicant_two: 'Secondary Applicant'
};

const SimulationSetupWizard = ({ isOpen, onClose, simulationId, simulationName, onSetupComplete }: SimulationSetupWizardProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupData, setSetupData] = useState<SimulationSetupData>({
    applicantCount: 'one_applicant',
    projectContactName: '',
    projectContactEmail: '',
    projectContactPhone: '',
    participants: []
  });

  const totalSteps = 4;

  // Generate initial participants based on applicant count
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
    setSetupData(prev => ({
      ...prev,
      applicantCount: count,
      participants: generateParticipants(count)
    }));
  };

  const handleParticipantChange = (index: number, field: keyof ParticipantData, value: string) => {
    setSetupData(prev => ({
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validate participants
      const validationErrors: string[] = [];
      setupData.participants.forEach((participant, index) => {
        const errors = simulationParticipantService.validateParticipant(participant);
        if (errors.length > 0) {
          validationErrors.push(`Participant ${index + 1}: ${errors.join(', ')}`);
        }
      });

      if (validationErrors.length > 0) {
        toast({
          title: "Validation Error",
          description: validationErrors.join('\n'),
          variant: "destructive",
        });
        return;
      }

      // Update simulation with setup data
      await simulationService.completeSimulationSetup(simulationId, {
        applicantCount: setupData.applicantCount,
        projectContactName: setupData.projectContactName,
        projectContactEmail: setupData.projectContactEmail,
        projectContactPhone: setupData.projectContactPhone,
      });

      // Create participants
      await simulationParticipantService.createParticipants(simulationId, setupData.participants);

      toast({
        title: "Setup Complete",
        description: "Simulation setup has been completed successfully.",
      });

      onSetupComplete();
      handleClose();
    } catch (error) {
      console.error('Error completing setup:', error);
      toast({
        title: "Setup Error",
        description: "Failed to complete simulation setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCurrentStep(1);
      setSetupData({
        applicantCount: 'one_applicant',
        projectContactName: '',
        projectContactEmail: '',
        projectContactPhone: '',
        participants: []
      });
      onClose();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true; // applicantCount always has a default value
      case 2:
        return setupData.projectContactName.trim().length > 0 && 
               setupData.projectContactEmail.trim().length > 0;
      case 3:
        return setupData.participants.every(p => 
          p.firstName.trim().length > 0 && 
          p.lastName.trim().length > 0 && 
          p.email.trim().length > 0
        );
      case 4:
        return true; // Confirmation step
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
              <h3 className="text-lg font-medium mb-2">Number of Applicants</h3>
              <p className="text-sm text-muted-foreground mb-4">
                How many applicants will participate in this mortgage simulation?
              </p>
            </div>
            <div className="space-y-2">
              <Label>Applicant Count *</Label>
              <Select
                value={setupData.applicantCount}
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

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Project Contact Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Provide contact information for this simulation project.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Contact Name *</Label>
                <Input
                  id="contact-name"
                  value={setupData.projectContactName}
                  onChange={(e) => setSetupData(prev => ({ ...prev, projectContactName: e.target.value }))}
                  placeholder="Enter contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={setupData.projectContactEmail}
                  onChange={(e) => setSetupData(prev => ({ ...prev, projectContactEmail: e.target.value }))}
                  placeholder="Enter contact email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Contact Phone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={setupData.projectContactPhone}
                  onChange={(e) => setSetupData(prev => ({ ...prev, projectContactPhone: e.target.value }))}
                  placeholder="Enter contact phone"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Participant Information</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter details for each simulation participant.
              </p>
            </div>
            <div className="space-y-4">
              {setupData.participants.map((participant, index) => (
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
                        <Label>First Name *</Label>
                        <Input
                          value={participant.firstName}
                          onChange={(e) => handleParticipantChange(index, 'firstName', e.target.value)}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name *</Label>
                        <Input
                          value={participant.lastName}
                          onChange={(e) => handleParticipantChange(index, 'lastName', e.target.value)}
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={participant.email}
                        onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={participant.phone}
                        onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Review & Confirm</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please review your simulation setup before completing.
              </p>
            </div>
            
            <Card className="bg-accent/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Simulation Setup Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Simulation:</span>
                  <span className="font-medium">{simulationName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Applicants:</span>
                  <Badge variant="secondary">
                    {APPLICANT_COUNT_LABELS[setupData.applicantCount]}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Contact Details:</span>
                  <div className="text-sm space-y-1 pl-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {setupData.projectContactName}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {setupData.projectContactEmail}
                    </div>
                    {setupData.projectContactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {setupData.projectContactPhone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Participants:</span>
                  <div className="text-sm space-y-1 pl-2">
                    {setupData.participants.map((participant, index) => (
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Simulation Setup</DialogTitle>
          <DialogDescription>
            Step {currentStep} of {totalSteps}: Configure your simulation
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
            disabled={currentStep === 1 || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid() || isSubmitting}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || isSubmitting}
            >
              {isSubmitting ? 'Completing...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimulationSetupWizard;