
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { UnifiedInvitationService } from '@/services/unifiedInvitationService';
import { validateAndProcessInvitationToken } from '@/services/invitationTokenService';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔗 [INVITE PAGE] Processing invitation with token:', token);
    
    const processInvitation = async () => {
      if (!token) {
        console.error('❌ [INVITE PAGE] No token provided');
        setError('Invalid invitation link - no token provided');
        setLoading(false);
        return;
      }

      try {
        // Validate the invitation token first
        const tokenValidation = await validateAndProcessInvitationToken(token);
        
        if (!tokenValidation.invitation) {
          console.error('❌ [INVITE PAGE] Invalid token:', tokenValidation.error);
          setError(tokenValidation.error || 'Invalid invitation link');
          setLoading(false);
          return;
        }

        const invitation = tokenValidation.invitation;
        console.log('✅ [INVITE PAGE] Valid invitation found:', invitation);

        // Check if user already exists
        const statusCheck = await UnifiedInvitationService.checkInvitationStatus(invitation.email);
        
        if (statusCheck.user_exists && statusCheck.user_id) {
          console.log('👤 [INVITE PAGE] User exists, redirecting to auth with context');
          // User exists - redirect to auth with invitation context for login
          navigate(`/auth?invitation_token=${encodeURIComponent(token)}&email=${encodeURIComponent(invitation.email)}&action=login`, { replace: true });
        } else {
          console.log('👤 [INVITE PAGE] New user, redirecting to auth for signup');
          // New user - redirect to auth with invitation context for signup
          navigate(`/auth?invitation_token=${encodeURIComponent(token)}&email=${encodeURIComponent(invitation.email)}&action=signup`, { replace: true });
        }
      } catch (error) {
        console.error('❌ [INVITE PAGE] Error processing invitation:', error);
        setError(error instanceof Error ? error.message : 'Failed to process invitation');
        setLoading(false);
      }
    };

    processInvitation();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              Processing Invitation...
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Validating your invitation and preparing your access...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              Invitation Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              Please contact the person who sent you this invitation for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null; // This should not be reached due to redirects
};

export default InvitePage;
