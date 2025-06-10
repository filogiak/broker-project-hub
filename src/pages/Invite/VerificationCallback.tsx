
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VerificationCallback = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleVerification = async () => {
      try {
        console.log('🔍 [VERIFICATION CALLBACK] Starting email verification process...');
        
        // Check if we're coming from an email verification link
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('🔗 [VERIFICATION CALLBACK] Email verification tokens found, processing...');
          
          // Set the session from the URL tokens
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            console.error('❌ [VERIFICATION CALLBACK] Session error:', sessionError);
            throw new Error('Failed to verify email: ' + sessionError.message);
          }
          
          console.log('✅ [VERIFICATION CALLBACK] Email verification successful');
          
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          setSuccess(true);
          
          // Wait a moment then redirect
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // No verification tokens, redirect to login
          console.log('🔄 [VERIFICATION CALLBACK] No verification tokens found, redirecting to auth');
          navigate('/auth');
        }

      } catch (error) {
        console.error('❌ [VERIFICATION CALLBACK] Error during verification:', error);
        setError(error instanceof Error ? error.message : 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

    handleVerification();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Verifying Email</CardTitle>
            <p className="text-muted-foreground">Please wait while we verify your email address...</p>
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
            <Button onClick={() => navigate('/auth')} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Email Verified!</CardTitle>
            <p className="text-muted-foreground">
              Your email has been verified successfully. You're being redirected to your dashboard...
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return null;
};

export default VerificationCallback;
