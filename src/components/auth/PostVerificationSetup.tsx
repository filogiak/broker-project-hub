
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, XCircle, User, Users, UserCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedInvitationService } from '@/services/unifiedInvitationService';
import { PostAuthInvitationService } from '@/services/postAuthInvitationService';
import { debugAuthState, validateSessionBeforeOperation } from '@/services/authDebugService';
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
      id: 'auth',
      label: 'Validating authentication',
      status: 'pending',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      id: 'profile',
      label: 'Setting up your profile',
      status: 'pending',
      icon: <User className="h-4 w-4" />
    },
    {
      id: 'invitation',
      label: 'Processing your invitation',
      status: 'pending',
      icon: <Users className="h-4 w-4" />
    },
    {
      id: 'redirect',
      label: 'Completing setup',
      status: 'pending',
      icon: <UserCheck className="h-4 w-4" />
    }
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  const updateStepStatus = (stepId: string, status: SetupStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const waitForAuthStabilization = async (maxAttempts = 10): Promise<boolean> => {
    console.log('🕐 [POST-VERIFICATION] Waiting for auth stabilization...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const authDebug = await debugAuthState();
        console.log(`🔍 [POST-VERIFICATION] Auth check attempt ${attempt}:`, {
          sessionExists: authDebug.sessionExists,
          userExists: authDebug.userExists,
          dbContext: authDebug.dbContextUserId,
          environment: authDebug.environment
        });
        
        if (authDebug.sessionExists && authDebug.userExists && authDebug.dbContextUserId) {
          console.log('✅ [POST-VERIFICATION] Auth stabilized successfully');
          return true;
        }
        
        if (attempt < maxAttempts) {
          console.log(`⏳ [POST-VERIFICATION] Auth not ready, waiting... (${attempt}/${maxAttempts})`);
          await delay(1000);
        }
      } catch (error) {
        console.error(`❌ [POST-VERIFICATION] Auth check error on attempt ${attempt}:`, error);
        if (attempt < maxAttempts) {
          await delay(1000);
        }
      }
    }
    
    console.error('❌ [POST-VERIFICATION] Auth stabilization timeout');
    return false;
  };

  const runSetup = async () => {
    try {
      console.log('🔄 [POST-VERIFICATION] Starting setup process...');
      setHasError(false);
      setErrorMessage('');
      setRetryAttempt(prev => prev + 1);

      // Step 0: Validate authentication state
      updateStepStatus('auth', 'loading');
      setCurrentStep(0);

      console.log('🔐 [POST-VERIFICATION] Validating authentication state...');
      
      const authStabilized = await waitForAuthStabilization();
      if (!authStabilized) {
        throw new Error('Authentication state not stable after 10 seconds. Please try refreshing the page.');
      }
      
      const { valid: sessionValid, session } = await validateSessionBeforeOperation();
      if (!sessionValid || !session?.user) {
        throw new Error('Session validation failed. Please refresh the page and try again.');
      }
      
      if (session.user.id !== userId) {
        throw new Error('User ID mismatch detected. Please log out and try again.');
      }

      updateStepStatus('auth', 'complete');
      await delay(300);

      // Step 1: Wait for profile creation
      updateStepStatus('profile', 'loading');
      setCurrentStep(1);

      console.log('📝 [POST-VERIFICATION] Waiting for profile creation...');
      
      // Wait for profile creation with extended timeout
      let profileFound = false;
      for (let attempt = 1; attempt <= 15; attempt++) {
        console.log(`🔍 [POST-VERIFICATION] Profile check attempt ${attempt}/15`);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.error(`❌ [POST-VERIFICATION] Profile check error (attempt ${attempt}):`, profileError);
          if (attempt === 15) {
            throw new Error(`Profile verification failed: ${profileError.message}. This indicates a database trigger issue.`);
          }
          await delay(2000);
          continue;
        }

        if (profile) {
          console.log('✅ [POST-VERIFICATION] Profile found:', {
            profileId: profile.id,
            email: profile.email,
            createdAt: profile.created_at
          });
          
          profileFound = true;
          break;
        } else {
          console.log(`⏳ [POST-VERIFICATION] Profile not yet created, waiting... (${attempt}/15)`);
          await delay(2000);
        }
      }

      if (!profileFound) {
        throw new Error('Profile was not created automatically after 30 seconds. The database trigger may not be functioning correctly.');
      }

      updateStepStatus('profile', 'complete');
      await delay(300);

      // Step 2: Process invitation
      updateStepStatus('invitation', 'loading');
      setCurrentStep(2);

      console.log('🎯 [POST-VERIFICATION] Processing invitation...');
      
      try {
        const acceptResult = await UnifiedInvitationService.acceptInvitationById(invitation.id);
        
        if (!acceptResult.success) {
          console.error('❌ [POST-VERIFICATION] Failed to accept invitation:', acceptResult.error);
          throw new Error(acceptResult.error || 'Failed to accept invitation');
        }
        
        console.log('✅ [POST-VERIFICATION] Invitation accepted successfully');
        updateStepStatus('invitation', 'complete');
        await delay(300);
      } catch (invitationError) {
        console.error('❌ [POST-VERIFICATION] Invitation processing error:', invitationError);
        // Don't fail the entire setup if invitation processing fails
        // The user can accept it manually from the dashboard
        updateStepStatus('invitation', 'error');
        console.log('⚠️ [POST-VERIFICATION] Continuing setup despite invitation error');
        await delay(300);
      }

      // Step 3: Complete setup
      updateStepStatus('redirect', 'loading');
      setCurrentStep(3);

      console.log('🎯 [POST-VERIFICATION] Completing setup...');
      
      updateStepStatus('redirect', 'complete');
      await delay(300);

      console.log('🎉 [POST-VERIFICATION] Setup completed successfully');

      toast({
        title: "Welcome!",
        description: "Your account is ready. You'll be redirected to your dashboard.",
      });

      setTimeout(() => {
        onSetupComplete();
      }, 1000);

    } catch (error) {
      console.error('❌ [POST-VERIFICATION] Setup failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during setup';
      setErrorMessage(errorMessage);
      
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
    console.log('🔄 [POST-VERIFICATION] User initiated retry...');
    
    // Reset all steps to pending
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    setCurrentStep(0);
    setHasError(false);
    setErrorMessage('');
    runSetup();
  };

  useEffect(() => {
    console.log('🚀 [POST-VERIFICATION] Component mounted, starting setup...');
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
          Configuring your access and processing your invitation...
        </p>
        {retryAttempt > 1 && (
          <p className="text-xs text-muted-foreground">
            Retry attempt #{retryAttempt}
          </p>
        )}
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
          <div className="border-t pt-4 space-y-3">
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <strong>Setup Error:</strong> {errorMessage}
            </div>
            
            <Button onClick={handleRetry} className="w-full" variant="default">
              Try Again
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          You will be redirected to your dashboard once setup is complete.
        </div>
      </CardContent>
    </Card>
  );
};

export default PostVerificationSetup;
