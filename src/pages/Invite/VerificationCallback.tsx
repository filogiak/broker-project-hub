
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { validateInvitationCode } from '@/services/invitationService';
import PostVerificationSetup from '@/components/auth/PostVerificationSetup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

interface PendingInvitation {
  code: string;
  invitationId: string;
  email: string;
  role: string;
  projectId?: string;
}

const VerificationCallback = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authWaitAttempts, setAuthWaitAttempts] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('Initializing...');

  const MAX_AUTH_WAIT_ATTEMPTS = 30; // 30 seconds with 1 second intervals

  useEffect(() => {
    const handleVerification = async () => {
      try {
        console.log('🔍 [VERIFICATION CALLBACK] Starting verification process...');
        setCurrentStatus('Checking authentication status...');
        
        // First, check if we're coming from an email verification link
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('🔗 [VERIFICATION CALLBACK] Email verification tokens found, processing...');
          setCurrentStatus('Processing email verification...');
          
          try {
            // Set the session from the URL tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error('❌ [VERIFICATION CALLBACK] Session error:', sessionError);
              throw new Error('Failed to verify email: ' + sessionError.message);
            }
            
            console.log('✅ [VERIFICATION CALLBACK] Session set from email verification tokens');
            
            // Clear the URL parameters to clean up the browser history
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Wait a bit for the auth state to stabilize
            setCurrentStatus('Completing authentication...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.error('❌ [VERIFICATION CALLBACK] Error setting session:', error);
            throw new Error('Email verification failed. Please try again.');
          }
        }

        // Wait for authentication to be ready if we don't have a user yet
        if (!user && !authLoading) {
          console.log('🕐 [VERIFICATION CALLBACK] Waiting for authentication to complete...');
          setCurrentStatus('Waiting for authentication...');
          
          // Progressive waiting with timeout
          const waitForAuth = async (): Promise<boolean> => {
            for (let attempt = 0; attempt < MAX_AUTH_WAIT_ATTEMPTS; attempt++) {
              setAuthWaitAttempts(attempt + 1);
              
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              
              if (currentSession?.user) {
                console.log('✅ [VERIFICATION CALLBACK] Authentication completed after', attempt + 1, 'attempts');
                return true;
              }
              
              console.log(`🕐 [VERIFICATION CALLBACK] Auth attempt ${attempt + 1}/${MAX_AUTH_WAIT_ATTEMPTS}, still waiting...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            return false;
          };
          
          const authSuccess = await waitForAuth();
          
          if (!authSuccess) {
            throw new Error('Authentication timeout. Please try logging in again.');
          }
        }

        // Get the invitation data
        setCurrentStatus('Loading invitation details...');
        
        const pendingInvitationData = sessionStorage.getItem('pendingInvitation');
        let pendingInvitation: PendingInvitation | null = null;
        
        if (pendingInvitationData) {
          try {
            pendingInvitation = JSON.parse(pendingInvitationData);
            console.log('📋 [VERIFICATION CALLBACK] Found pending invitation:', pendingInvitation);
          } catch (parseError) {
            console.error('❌ [VERIFICATION CALLBACK] Error parsing pending invitation:', parseError);
          }
        }

        if (!pendingInvitation?.code) {
          throw new Error('No invitation code found. Please start the invitation process again.');
        }

        console.log('📋 [VERIFICATION CALLBACK] Validating invitation code:', pendingInvitation.code);

        // Validate the invitation code
        const validInvitation = await validateInvitationCode(pendingInvitation.code);
        
        if (!validInvitation) {
          throw new Error('Invalid or expired invitation code.');
        }

        setInvitation(validInvitation);
        console.log('✅ [VERIFICATION CALLBACK] Invitation validated successfully');

        // Clear the stored invitation data
        sessionStorage.removeItem('pendingInvitation');

      } catch (error) {
        console.error('❌ [VERIFICATION CALLBACK] Error during verification:', error);
        setError(error instanceof Error ? error.message : 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

    // Only run verification when the component mounts
    handleVerification();
  }, []); // Remove authLoading dependency to avoid re-runs

  const handleSetupComplete = () => {
    console.log('🎉 [VERIFICATION CALLBACK] Setup completed, redirecting...');
    
    if (invitation?.project_id) {
      navigate(`/project/${invitation.project_id}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleReturnToInvite = () => {
    navigate('/invite');
  };

  const handleRetryAuth = () => {
    console.log('🔄 [VERIFICATION CALLBACK] Retrying authentication...');
    setError(null);
    setLoading(true);
    setAuthWaitAttempts(0);
    // Trigger a page reload to restart the flow
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Processing Verification</CardTitle>
            <p className="text-muted-foreground">{currentStatus}</p>
            {authWaitAttempts > 0 && (
              <p className="text-xs text-muted-foreground">
                Authentication attempt {authWaitAttempts}/{MAX_AUTH_WAIT_ATTEMPTS}
              </p>
            )}
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-destructive">Verification Failed</CardTitle>
            <p className="text-muted-foreground">{error}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={handleRetryAuth} className="w-full">
              Try Again
            </Button>
            <Button onClick={handleReturnToInvite} variant="outline" className="w-full">
              Return to Invitation Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <p className="text-muted-foreground">
              Please complete the authentication process to continue.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={handleRetryAuth} className="w-full">
              Retry Authentication
            </Button>
            <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">No Invitation Found</CardTitle>
            <p className="text-muted-foreground">
              Unable to find a valid invitation to process.
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={handleReturnToInvite} className="w-full">
              Return to Invitation Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <PostVerificationSetup
        invitation={invitation}
        userId={user.id}
        onSetupComplete={handleSetupComplete}
      />
    </div>
  );
};

export default VerificationCallback;
