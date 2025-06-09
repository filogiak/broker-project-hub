
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateInvitationCode, acceptInvitation } from '@/services/invitationService';
import type { Database } from '@/integrations/supabase/types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

const InvitePage = () => {
  const [invitationCode, setInvitationCode] = useState('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [userDetails, setUserDetails] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'register'>('code');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [INVITE PAGE] Form submission started with code:', invitationCode);
    
    if (invitationCode.length !== 6) {
      console.warn('⚠️ [INVITE PAGE] Invalid code length:', invitationCode.length);
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit invitation code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('📞 [INVITE PAGE] Calling validateInvitationCode service...');
      const validInvitation = await validateInvitationCode(invitationCode);
      
      if (!validInvitation) {
        console.warn('⚠️ [INVITE PAGE] Invitation validation failed for code:', invitationCode);
        toast({
          title: "Invalid Code",
          description: "The invitation code is invalid, expired, or has already been used",
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
        title: "Code Validated",
        description: `Welcome! Please complete your registration for ${validInvitation.email}`,
      });

    } catch (error) {
      console.error('❌ [INVITE PAGE] Error validating code:', {
        error,
        code: invitationCode,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast({
        title: "Validation Error",
        description: "Failed to validate invitation code. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 [INVITE PAGE] Code validation completed');
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
      // Create user account
      console.log('👤 [INVITE PAGE] Creating user account...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userDetails.email,
        password: userDetails.password,
        options: {
          data: {
            first_name: userDetails.firstName,
            last_name: userDetails.lastName,
          },
          emailRedirectTo: `${window.location.origin}/`,
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
        email: authData.user.email
      });

      // Accept the invitation
      console.log('🤝 [INVITE PAGE] Accepting invitation...');
      await acceptInvitation(invitation.id, authData.user.id);

      console.log('🎉 [INVITE PAGE] Registration and invitation acceptance completed');

      toast({
        title: "Welcome!",
        description: "Your account has been created and you've joined the project",
      });

      // Redirect to the project
      if (invitation.project_id) {
        console.log('🔄 [INVITE PAGE] Redirecting to project:', invitation.project_id);
        navigate(`/project/${invitation.project_id}`);
      } else {
        console.log('🔄 [INVITE PAGE] Redirecting to dashboard');
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('❌ [INVITE PAGE] Error during registration process:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        invitationId: invitation.id
      });
      
      let errorMessage = "Failed to complete registration";
      
      // Provide more specific error messages
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

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  console.log('🎨 [INVITE PAGE] Rendering with state:', {
    step,
    isLoading,
    hasInvitation: !!invitation,
    codeLength: invitationCode.length
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Project</CardTitle>
          <p className="text-muted-foreground">
            {step === 'code' 
              ? 'Enter your 6-digit invitation code to get started'
              : 'Complete your account setup'
            }
          </p>
        </CardHeader>
        <CardContent>
          {step === 'code' ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Invitation Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="text-center text-lg tracking-wider font-mono"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code you received from your project manager
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading || invitationCode.length !== 6}>
                {isLoading ? 'Validating...' : 'Continue'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {invitation && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p><strong>Email:</strong> {invitation.email}</p>
                  <p><strong>Role:</strong> {formatRole(invitation.role)}</p>
                  {invitation.project_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll be added to the project upon completion
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
                    onClick={() => setStep('code')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Creating Account...' : 'Join Project'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitePage;
