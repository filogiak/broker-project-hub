import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { createSimulationInvitation } from '@/services/simulationInvitationService';
import { supabase } from '@/integrations/supabase/client';
import { Mail, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type ApplicantCount = Database['public']['Enums']['applicant_count'];

interface SimulationInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationId: string;
  onMemberAdded: () => void;
}

const SimulationInvitationModal = ({ isOpen, onClose, simulationId, onMemberAdded }: SimulationInvitationModalProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('simulation_collaborator');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [invitationSuccess, setInvitationSuccess] = useState(false);
  const [simulationApplicantCount, setSimulationApplicantCount] = useState<ApplicantCount | null>(null);
  const [suggestedEmails, setSuggestedEmails] = useState<string[]>([]);
  const { toast } = useToast();

  // Simulation-specific roles
  const roleOptions = [
    { value: 'simulation_collaborator' as UserRole, label: 'Simulation Collaborator' },
    { value: 'real_estate_agent' as UserRole, label: 'Real Estate Agent' },
    { value: 'broker_assistant' as UserRole, label: 'Broker Assistant' },
  ];

  useEffect(() => {
    const loadSimulationInfo = async () => {
      if (!isOpen || !simulationId) return;

      try {
        // Get simulation applicant count
        const { data: simulationData, error: simulationError } = await supabase
          .from('simulations')
          .select('applicant_count')
          .eq('id', simulationId)
          .single();

        if (simulationError) {
          console.error('Error loading simulation:', simulationError);
          return;
        }

        setSimulationApplicantCount(simulationData.applicant_count);

        // Get suggested emails from simulation participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('simulation_participants')
          .select('email')
          .eq('simulation_id', simulationId);

        if (participantsError) {
          console.error('Error loading participants:', participantsError);
          return;
        }

        const emails = participantsData?.map(p => p.email) || [];
        setSuggestedEmails(emails);

      } catch (error) {
        console.error('Error loading simulation info:', error);
      }
    };

    loadSimulationInfo();
  }, [isOpen, simulationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [SIMULATION INVITATION MODAL] Form submission started');
    console.log('🚀 [SIMULATION INVITATION MODAL] Form data:', { email: email.trim(), role, simulationId });
    
    if (!email.trim()) {
      console.warn('⚠️ [SIMULATION INVITATION MODAL] Email validation failed - empty email');
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.warn('⚠️ [SIMULATION INVITATION MODAL] Email validation failed - invalid format');
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ [SIMULATION INVITATION MODAL] Form validation passed');
    setIsLoading(true);

    try {
      console.log('📞 [SIMULATION INVITATION MODAL] Calling createSimulationInvitation...');
      const result = await createSimulationInvitation(simulationId, role, email.trim());
      
      console.log('🎉 [SIMULATION INVITATION MODAL] Invitation creation completed, success:', result.success);
      
      setEmailSent(true);
      setInvitationSuccess(result.success);
      
      if (result.success) {
        toast({
          title: "Invitation Sent",
          description: `Invitation email has been sent to ${email}`,
        });
      } else {
        toast({
          title: "Invitation Created",
          description: result.error || `Invitation created but email failed to send. Please contact ${email} directly.`,
          variant: "destructive",
        });
      }

      console.log('🔄 [SIMULATION INVITATION MODAL] Calling onMemberAdded callback');
      onMemberAdded();

    } catch (error) {
      console.error('❌ [SIMULATION INVITATION MODAL] Invitation creation error:', error);
      
      let errorMessage = "Failed to create invitation";
      
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          errorMessage = "Authentication failed. Please log in again and try.";
        } else if (error.message.includes('session')) {
          errorMessage = "Session expired. Please refresh the page and try again.";
        } else if (error.message.includes('permission')) {
          errorMessage = "You don't have permission to invite members to this simulation.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('🏁 [SIMULATION INVITATION MODAL] Form submission completed');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 [SIMULATION INVITATION MODAL] Modal closing, resetting state');
    setEmail('');
    setRole('simulation_collaborator');
    setEmailSent(false);
    setInvitationSuccess(false);
    onClose();
  };

  const handleSuggestedEmailClick = (suggestedEmail: string) => {
    setEmail(suggestedEmail);
  };

  console.log('🎨 [SIMULATION INVITATION MODAL] Rendering modal with state:', { 
    isOpen, 
    isLoading, 
    emailSent,
    invitationSuccess,
    email,
    role,
    simulationApplicantCount,
    suggestedEmails: suggestedEmails.length
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Simulation Member</DialogTitle>
        </DialogHeader>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Simulation Applicant Info */}
            {simulationApplicantCount && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Simulation Configuration: {simulationApplicantCount.replace(/_/g, ' ')}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
              
              {/* Suggested emails from participants */}
              {suggestedEmails.length > 0 && (
                <div className="mt-2">
                  <Label className="text-sm text-muted-foreground">Suggested emails from simulation participants:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {suggestedEmails.map((suggestedEmail, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={() => handleSuggestedEmailClick(suggestedEmail)}
                      >
                        {suggestedEmail}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Member Role</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
                {roleOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value}
                    />
                    <Label 
                      htmlFor={option.value} 
                      className="cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending Invitation...' : 'Send Email Invitation'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <div className="flex justify-center">
                {invitationSuccess ? (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                ) : (
                  <Mail className="h-12 w-12 text-yellow-500" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold">
                {invitationSuccess ? 'Invitation Sent!' : 'Invitation Created'}
              </h3>
              
              <p className="text-muted-foreground">
                {invitationSuccess ? (
                  <>An invitation email has been sent to <strong>{email}</strong></>
                ) : (
                  <>Invitation created for <strong>{email}</strong> but email delivery failed</>
                )}
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              {invitationSuccess ? (
                <p>
                  The invited user will receive an email with a direct link to join the simulation.
                  They'll be able to create their account and join in one simple step.
                </p>
              ) : (
                <p>
                  Please contact <strong>{email}</strong> directly and ask them to visit the
                  invitation page to join the simulation.
                </p>
              )}
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimulationInvitationModal;