
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
    
    if (invitationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit invitation code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const validInvitation = await validateInvitationCode(invitationCode);
      
      if (!validInvitation) {
        toast({
          title: "Invalid Code",
          description: "The invitation code is invalid or has expired",
          variant: "destructive",
        });
        return;
      }

      setInvitation(validInvitation);
      setUserDetails(prev => ({ ...prev, email: validInvitation.email }));
      setStep('register');

    } catch (error) {
      console.error('Error validating code:', error);
      toast({
        title: "Error",
        description: "Failed to validate invitation code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) return;

    setIsLoading(true);

    try {
      // Create user account
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
        console.error('Auth error:', authError);
        toast({
          title: "Registration Failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: "Registration Failed",
          description: "Failed to create user account",
          variant: "destructive",
        });
        return;
      }

      // Accept the invitation
      await acceptInvitation(invitation.id, authData.user.id);

      toast({
        title: "Welcome!",
        description: "Your account has been created and you've joined the project",
      });

      // Redirect to the project
      if (invitation.project_id) {
        navigate(`/project/${invitation.project_id}`);
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error('Error during registration:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

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
