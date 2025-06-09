
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { validateInvitationCode } from '@/services/invitationService';
import PostVerificationSetup from '@/components/auth/PostVerificationSetup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

const VerificationCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleVerification = async () => {
      try {
        console.log('🔍 [VERIFICATION CALLBACK] Starting verification process...');
        
        // Get the invitation code from URL or session storage
        const invitationCode = searchParams.get('code') || sessionStorage.getItem('pendingInvitationCode');
        
        if (!invitationCode) {
          setError('No invitation code found. Please start the invitation process again.');
          return;
        }

        console.log('📋 [VERIFICATION CALLBACK] Found invitation code:', invitationCode);

        // Validate the invitation code
        const validInvitation = await validateInvitationCode(invitationCode);
        
        if (!validInvitation) {
          setError('Invalid or expired invitation code.');
          return;
        }

        setInvitation(validInvitation);
        console.log('✅ [VERIFICATION CALLBACK] Invitation validated successfully');

        // Clear the stored code
        sessionStorage.removeItem('pendingInvitationCode');

      } catch (error) {
        console.error('❌ [VERIFICATION CALLBACK] Error during verification:', error);
        setError(error instanceof Error ? error.message : 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

    // Only run verification when not loading auth and we have search params
    if (!authLoading) {
      handleVerification();
    }
  }, [searchParams, authLoading]);

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Verifying...</CardTitle>
            <p className="text-muted-foreground">
              Please wait while we verify your email and set up your account.
            </p>
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
          <CardContent>
            <Button onClick={handleReturnToInvite} className="w-full">
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
              Please log in to complete the verification process.
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
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
