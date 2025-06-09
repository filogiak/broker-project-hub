
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, XCircle, User, Users, UserCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { acceptInvitation } from '@/services/invitationService';
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
      label: 'Creating your profile',
      status: 'pending',
      icon: <User className="h-4 w-4" />
    },
    {
      id: 'role',
      label: 'Assigning your role',
      status: 'pending',
      icon: <UserCheck className="h-4 w-4" />
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
  const [retryAttempt, setRetryAttempt] = useState(0);
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
      setRetryAttempt(prev => prev + 1);

      // Step 0: Validate authentication state
      updateStepStatus('auth', 'loading');
      setCurrentStep(0);

      console.log('🔐 [POST-VERIFICATION] Validating authentication state...');
      
      const authStabilized = await waitForAuthStabilization();
      if (!authStabilized) {
        throw new Error('Authentication state not stable. Please try logging in again.');
      }
      
      const { valid: sessionValid, session } = await validateSessionBeforeOperation();
      if (!sessionValid || !session?.user) {
        throw new Error('Session validation failed. Please try logging in again.');
      }
      
      if (session.user.id !== userId) {
        throw new Error('User ID mismatch. Please log out and try again.');
      }

      updateStepStatus('auth', 'complete');
      await delay(500);

      // Step 1: Create/verify profile
      updateStepStatus('profile', 'loading');
      setCurrentStep(1);

      console.log('📝 [POST-VERIFICATION] Creating/verifying user profile...');
      
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
        console.log('📝 [POST-VERIFICATION] Creating new profile...');
        
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: invitation.email,
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || ''
          });

        if (profileCreateError) {
          console.error('❌ [POST-VERIFICATION] Error creating profile:', profileCreateError);
          throw new Error('Failed to create profile: ' + profileCreateError.message);
        }
        
        console.log('✅ [POST-VERIFICATION] Profile created successfully');
      } else {
        console.log('✅ [POST-VERIFICATION] Profile already exists');
      }

      updateStepStatus('profile', 'complete');
      await delay(500);

      // Step 2: Assign user role
      updateStepStatus('role', 'loading');
      setCurrentStep(2);

      console.log('👤 [POST-VERIFICATION] Assigning user role...');
      
      // Check if role already exists
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', invitation.role)
        .maybeSingle();

      if (roleCheckError) {
        console.error('❌ [POST-VERIFICATION] Error checking user role:', roleCheckError);
        throw new Error('Failed to check user role: ' + roleCheckError.message);
      }

      if (!existingRole) {
        const { error: roleCreateError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: invitation.role
          });

        if (roleCreateError) {
          console.error('❌ [POST-VERIFICATION] Error creating user role:', roleCreateError);
          
          // Check if it's a duplicate constraint error
          if (roleCreateError.code === '23505') {
            console.log('⚠️ [POST-VERIFICATION] Role already exists (race condition)');
          } else {
            throw new Error('Failed to assign role: ' + roleCreateError.message);
          }
        } else {
          console.log('✅ [POST-VERIFICATION] Role assigned successfully');
        }
      } else {
        console.log('✅ [POST-VERIFICATION] Role already exists');
      }

      updateStepStatus('role', 'complete');
      await delay(500);

      // Step 3: Add to project and accept invitation
      updateStepStatus('project', 'loading');
      setCurrentStep(3);

      console.log('🤝 [POST-VERIFICATION] Accepting invitation and adding to project...');
      
      await acceptInvitation(invitation.id, userId);

      // Verify the user was actually added to the project
      if (invitation.project_id) {
        console.log('🔍 [POST-VERIFICATION] Verifying project membership...');
        
        const { data: projectMember, error: memberCheckError } = await supabase
          .from('project_members')
          .select('*')
          .eq('project_id', invitation.project_id)
          .eq('user_id', userId)
          .maybeSingle();

        if (memberCheckError) {
          console.error('❌ [POST-VERIFICATION] Error checking project membership:', memberCheckError);
          throw new Error('Failed to verify project membership: ' + memberCheckError.message);
        }

        if (!projectMember) {
          throw new Error('User was not successfully added to the project. Please contact support.');
        }
        
        console.log('✅ [POST-VERIFICATION] Project membership verified');
      }

      updateStepStatus('project', 'complete');
      await delay(500);

      console.log('🎉 [POST-VERIFICATION] Setup completed successfully');

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
    console.log('🔄 [POST-VERIFICATION] Retrying setup...');
    
    // Reset all steps to pending
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    setCurrentStep(0);
    setHasError(false);
    runSetup();
  };

  useEffect(() => {
    // Start setup automatically when component mounts
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
          Please wait while we complete your account setup...
        </p>
        {retryAttempt > 1 && (
          <p className="text-xs text-muted-foreground">
            Attempt #{retryAttempt}
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
