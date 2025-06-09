
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateInvitationToken, acceptInvitation } from '@/services/invitationService';
import PostVerificationSetup from '@/components/auth/PostVerificationSetup';
import type { Database } from '@/integrations/supabase/types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

const VerificationCallbackPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const validateAndProcess = async () => {
      console.log('🔍 [VERIFICATION CALLBACK] Starting validation process');
      console.log('🔍 [VERIFICATION CALLBACK] User:', user?.email);
      console.log('🔍 [VERIFICATION CALLBACK] Token:', token);
      
      if (!token) {
        console.error('❌ [VERIFICATION CALLBACK] No token provided');
        setLoading(false);
        return;
      }

      // Wait for auth to load
      if (authLoading) {
        console.log('⏳ [VERIFICATION CALLBACK] Waiting for auth to load...');
        return;
      }

      try {
        console.log('🔍 [VERIFICATION CALLBACK] Validating invitation token...');
        
        const validInvitation = await validateInvitationToken(token);
        
        if (!validInvitation) {
          console.error('❌ [VERIFICATION CALLBACK] Invalid invitation');
          toast({
            title: "Invalid Invitation",
            description: "This invitation link is invalid, expired, or has already been used.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log('✅ [VERIFICATION CALLBACK] Valid invitation found:', validInvitation);
        setInvitation(validInvitation);

        // If user is logged in, show setup; otherwise redirect to join page
        if (user) {
          console.log('👤 [VERIFICATION CALLBACK] User logged in, showing setup');
          setShowSetup(true);
        } else {
          console.log('🔄 [VERIFICATION CALLBACK] No user, redirecting to join page');
          navigate(`/invite/join/${token}`);
          return;
        }

      } catch (error) {
        console.error('❌ [VERIFICATION CALLBACK] Error:', error);
        toast({
          title: "Error",
          description: "Failed to process invitation. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    validateAndProcess();
  }, [token, user, authLoading, navigate, toast]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    setIsProcessing(true);
    
    try {
      console.log('🤝 [VERIFICATION CALLBACK] Accepting invitation...');
      
      await acceptInvitation(invitation.id, user.id);
      
      toast({
        title: "Success!",
        description: "You've been added to the project successfully.",
      });

      // Redirect to project
      if (invitation.project_id) {
        navigate(`/project/${invitation.project_id}`);
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('❌ [VERIFICATION CALLBACK] Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetupComplete = () => {
    console.log('🎉 [VERIFICATION CALLBACK] Setup completed');
    
    if (invitation?.project_id) {
      navigate(`/project/${invitation.project_id}`);
    } else {
      navigate('/dashboard');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg font-medium">Processing invitation...</div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              This invitation link is invalid, expired, or has already been used.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show setup for new users
  if (showSetup && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <PostVerificationSetup
          invitation={invitation}
          userId={user.id}
          onSetupComplete={handleSetupComplete}
        />
      </div>
    );
  }

  const roleDisplayName = invitation.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Accept Invitation</CardTitle>
          <p className="text-muted-foreground">
            You've been invited as a <strong>{roleDisplayName}</strong>
          </p>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Welcome {user?.firstName} {user?.lastName}! Would you like to accept this invitation?
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={handleAcceptInvitation}
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? 'Accepting...' : 'Accept Invitation'}
            </Button>
            
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationCallbackPage;
