
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateInvitationToken } from '@/services/invitationService';
import EmailVerificationScreen from '@/components/auth/EmailVerificationScreen';
import type { Database } from '@/integrations/supabase/types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

const InvitePage = () => {
  const [invitationToken, setInvitationToken] = useState('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [userDetails, setUserDetails] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'token' | 'register' | 'verify'>('token');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [INVITE PAGE] Form submission started with token:', invitationToken.substring(0, 10) + '...');
    
    if (!invitationToken.trim()) {
      console.warn('⚠️ [INVITE PAGE] Empty token provided');
      toast({
        title: "Invalid Token",
        description: "Please enter a valid invitation token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('📞 [INVITE PAGE] Calling validateInvitationToken service...');
      const validInvitation = await validateInvitationToken(invitationToken);
      
      if (!validInvitation) {
        console.warn('⚠️ [INVITE PAGE] Invitation validation failed for token:', invitationToken.substring(0, 10) + '...');
        toast({
          title: "Invalid Token",
          description: "The invitation token is invalid, expired, or has already been used",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ [INVITE PAGE] Invitation validation successful:', {
        id: validInvitation.id,
        email: validInvitation.email,
        role: validInvitation.role
      });

      setInvitation(validInvitation);
      setUserDetails(prev => ({ ...prev, email: validInvitation.email }));
      setStep('register');

      toast({
        title: "Token Validated",
        description: `Welcome! Please complete your registration for ${validInvitation.email}`,
      });

    } catch (error) {
      console.error('❌ [INVITE PAGE] Error validating token:', {
        error,
        token: invitationToken.substring(0, 10) + '...',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast({
        title: "Validation Error",
        description: "Failed to validate invitation token. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 [INVITE PAGE] Token validation completed');
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 [INVITE PAGE] Registration form submission started');
    
    if (!invitation) {
      console.error('❌ [INVITE PAGE] No invitation available for registration');
      return;
    }

    console.log('📝 [INVITE PAGE] Registration details:', {
      email: userDetails.email,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      invitationId: invitation.id
    });

    setIsLoading(true);

    try {
      // Store the invitation details securely for later retrieval
      const invitationData = {
        token: invitationToken,
        invitationId: invitation.id,
        email: invitation.email,
        role: invitation.role,
        projectId: invitation.project_id
      };
      
      sessionStorage.setItem('pendingInvitation', JSON.stringify(invitationData));

      console.log('📧 [INVITE PAGE] Creating user account with simplified redirect...');
      
      // Use simplified redirect URL without query parameters
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userDetails.email,
        password: userDetails.password,
        options: {
          data: {
            first_name: userDetails.firstName,
            last_name: userDetails.lastName,
          },
          emailRedirectTo: `${window.location.origin}/invite/verify`,
        },
      });

      if (authError) {
        console.error('❌ [INVITE PAGE] Auth error during registration:', authError);
        
        let errorMessage = authError.message;
        if (authError.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please try logging in instead.';
        }
        
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        console.error('❌ [INVITE PAGE] No user returned from registration');
        toast({
          title: "Registration Failed",
          description: "Failed to create user account",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ [INVITE PAGE] User account created successfully:', {
        userId: authData.user.id,
        email: authData.user.email,
        needsConfirmation: !authData.session
      });

      // If the user needs to confirm email, show verification screen
      if (!authData.session) {
        console.log('📧 [INVITE PAGE] Email confirmation required, showing verification screen');
        setStep('verify');
        
        toast({
          title: "Check Your Email",
          description: "We've sent a verification link to complete your account setup.",
        });
      } else {
        // If somehow no confirmation is needed, redirect to verification callback
        console.log('🔄 [INVITE PAGE] No email confirmation needed, redirecting to verification...');
        navigate('/invite/verify');
      }

    } catch (error) {
      console.error('❌ [INVITE PAGE] Error during registration process:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        invitationId: invitation.id
      });
      
      let errorMessage = "Failed to complete registration";
      
      if (error instanceof Error) {
        if (error.message.includes('already a member')) {
          errorMessage = "You're already a member of this project. Please try logging in instead.";
        } else if (error.message.includes('authentication')) {
          errorMessage = "Authentication failed. Please try again or contact support.";
        } else if (error.message.includes('session')) {
          errorMessage = "Session expired. Please refresh the page and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('🏁 [INVITE PAGE] Registration process completed');
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    console.log('✅ [INVITE PAGE] Email verification completed, redirecting...');
    navigate('/invite/verify');
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  console.log('🎨 [INVITE PAGE] Rendering with state:', {
    step,
    isLoading,
    hasInvitation: !!invitation,
    tokenLength: invitationToken.length
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Project</CardTitle>
          <p className="text-muted-foreground">
            {step === 'token' 
              ? 'Enter your invitation token to get started'
              : step === 'register'
              ? 'Complete your account setup'
              : 'Verify your email address'
            }
          </p>
        </CardHeader>
        <CardContent>
          {step === 'token' ? (
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Invitation Token</Label>
                <Input
                  id="token"
                  type="text"
                  value={invitationToken}
                  onChange={(e) => setInvitationToken(e.target.value.trim())}
                  placeholder="Enter your invitation token"
                  className="text-center text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the token you received in the invitation email
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading || !invitationToken.trim()}>
                {isLoading ? 'Validating...' : 'Continue'}
              </Button>
            </form>
          ) : step === 'register' ? (
            <div className="space-y-4">
              {invitation && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p><strong>Email:</strong> {invitation.email}</p>
                  <p><strong>Role:</strong> {formatRole(invitation.role)}</p>
                  {invitation.project_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll be added to the project after email verification
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleRegistration} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={userDetails.firstName}
                      onChange={(e) => setUserDetails(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userDetails.lastName}
                      onChange={(e) => setUserDetails(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userDetails.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    This email was specified in your invitation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userDetails.password}
                    onChange={(e) => setUserDetails(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Create a password"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 characters
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('token')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <EmailVerificationScreen
              email={userDetails.email}
              onVerificationComplete={handleVerificationComplete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitePage;
