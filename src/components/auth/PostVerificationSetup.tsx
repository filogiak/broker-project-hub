
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, XCircle, User, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { acceptInvitation } from '@/services/invitationService';
import type { Database } from '@/integrations/supabase/types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

interface PostVerificationSetupProps {
  invitation: Invitation;
  userId: string;
  onSetupComplete: () => void;
}

interface SetupStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  icon: React.ReactNode;
}

const PostVerificationSetup: React.FC<PostVerificationSetupProps> = ({
  invitation,
  userId,
  onSetupComplete
}) => {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'profile',
      label: 'Creating your profile',
      status: 'pending',
      icon: <User className="h-4 w-4" />
    },
    {
      id: 'project',
      label: 'Adding you to the project',
      status: 'pending',
      icon: <Users className="h-4 w-4" />
    }
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  const updateStepStatus = (stepId: string, status: SetupStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runSetup = async () => {
    try {
      // Step 1: Create/verify profile
      updateStepStatus('profile', 'loading');
      setCurrentStep(0);

      console.log('🔄 [POST-VERIFICATION] Starting profile setup for user:', userId);
      
      // Check if profile already exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileCheckError) {
        console.error('❌ [POST-VERIFICATION] Error checking profile:', profileCheckError);
        throw new Error('Failed to check profile: ' + profileCheckError.message);
      }

      if (!existingProfile) {
        // Create profile if it doesn't exist (shouldn't happen due to trigger, but just in case)
        console.log('📝 [POST-VERIFICATION] Creating missing profile...');
        
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: invitation.email,
            first_name: '',
            last_name: ''
          });

        if (profileCreateError) {
          console.error('❌ [POST-VERIFICATION] Error creating profile:', profileCreateError);
          throw new Error('Failed to create profile: ' + profileCreateError.message);
        }
      }

      updateStepStatus('profile', 'complete');
      await delay(500); // Small delay for UX

      // Step 2: Add to project and accept invitation
      updateStepStatus('project', 'loading');
      setCurrentStep(1);

      console.log('🤝 [POST-VERIFICATION] Accepting invitation and adding to project...');
      
      await acceptInvitation(invitation.id, userId);

      updateStepStatus('project', 'complete');
      await delay(500);

      console.log('✅ [POST-VERIFICATION] Setup completed successfully');

      toast({
        title: "Welcome!",
        description: "Your account has been set up and you've joined the project successfully.",
      });

      // Complete setup after a short delay
      setTimeout(() => {
        onSetupComplete();
      }, 1000);

    } catch (error) {
      console.error('❌ [POST-VERIFICATION] Setup failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Mark current step as error
      if (currentStep < steps.length) {
        updateStepStatus(steps[currentStep].id, 'error');
      }
      
      setHasError(true);
      
      toast({
        title: "Setup Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    // Reset all steps to pending
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    setCurrentStep(0);
    setHasError(false);
    runSetup();
  };

  useEffect(() => {
    // Start setup automatically when component mounts
    runSetup();
  }, []);

  const getStepIcon = (step: SetupStep) => {
    switch (step.status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Setting Up Your Account</CardTitle>
        <p className="text-muted-foreground">
          Please wait while we complete your account setup...
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              {getStepIcon(step)}
              <span className={`text-sm ${
                step.status === 'complete' ? 'text-green-700' :
                step.status === 'error' ? 'text-red-700' :
                step.status === 'loading' ? 'text-blue-700' :
                'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {hasError && (
          <div className="border-t pt-4">
            <Button onClick={handleRetry} className="w-full">
              Try Again
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          This process usually takes a few seconds. Please don't close this page.
        </div>
      </CardContent>
    </Card>
  );
};

export default PostVerificationSetup;
