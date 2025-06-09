
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateInvitationToken, acceptInvitation } from '@/services/invitationService';
import type { Database } from '@/integrations/supabase/types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

const InviteJoinPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const validateToken = async () => {
      console.log('🔍 [INVITE JOIN] Starting token validation process');
      console.log('🔍 [INVITE JOIN] Raw token from URL params:', token);
      
      if (!token) {
        console.error('❌ [INVITE JOIN] No token provided in URL params');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 [INVITE JOIN] Validating invitation token with service...');
        
        const validInvitation = await validateInvitationToken(token);
        
        if (!validInvitation) {
          console.error('❌ [INVITE JOIN] Invalid or expired token returned from service');
          toast({
            title: "Invalid Invitation",
            description: "This invitation link is invalid, expired, or has already been used.",
            variant: "destructive",
          });
          setInvitation(null);
          setLoading(false);
          return;
        }

        console.log('✅ [INVITE JOIN] Valid invitation found:', validInvitation);
        setInvitation(validInvitation);

      } catch (error) {
        console.error('❌ [INVITE JOIN] Error validating token:', error);
        toast({
          title: "Error",
          description: "Failed to validate invitation. Please try again.",
          variant: "destructive",
        });
        setInvitation(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, toast]);

  const waitForSession = async (maxAttempts = 10): Promise<{ session: any; user: any } | null> => {
    console.log('⏳ [INVITE JOIN] Waiting for session to stabilize...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error(`❌ [INVITE JOIN] Session error on attempt ${attempt}:`, error);
          continue;
        }
        
        if (session?.user) {
          console.log(`✅ [INVITE JOIN] Session found on attempt ${attempt}`);
          return { session, user: session.user };
        }
        
        if (attempt < maxAttempts) {
          console.log(`⏳ [INVITE JOIN] No session yet, waiting... (${attempt}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ [INVITE JOIN] Session check error on attempt ${attempt}:`, error);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.error('❌ [INVITE JOIN] Session timeout after all attempts');
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) return;

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('👤 [INVITE JOIN] Starting signup process for:', invitation.email);

      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      });

      if (authError) {
        console.error('❌ [INVITE JOIN] Auth error:', authError);
        toast({
          title: "Account Creation Failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        throw new Error('No user returned from signup');
      }

      console.log('✅ [INVITE JOIN] Account created successfully, waiting for session...');

      // Step 2: Wait for session to be established
      const sessionData = await waitForSession();
      
      if (!sessionData) {
        throw new Error('Session was not established after signup. Please try logging in.');
      }

      const { user } = sessionData;
      console.log('✅ [INVITE JOIN] Session established for user:', user.id);

      // Step 3: Use the invitation service to handle role assignment and project membership
      console.log('🤝 [INVITE JOIN] Accepting invitation and assigning roles...');
      
      await acceptInvitation(invitation.id, user.id);

      console.log('🎉 [INVITE JOIN] Complete signup flow successful');

      toast({
        title: "Welcome!",
        description: "Your account has been created successfully. Welcome to the project!",
      });

      // Step 4: Navigate to the appropriate dashboard
      if (invitation.project_id) {
        navigate(`/project/${invitation.project_id}`);
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('❌ [INVITE JOIN] Complete signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating your account. Please try again.';
      
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg font-medium">Validating invitation...</div>
          {token && (
            <div className="text-sm text-gray-500 mt-2">
              Token: {token.substring(0, 10)}...
            </div>
          )}
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
            {token && (
              <div className="text-xs text-gray-400 mb-4 font-mono break-all">
                Token: {token}
              </div>
            )}
            <Button onClick={() => navigate('/')} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleDisplayName = invitation.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join the Project</CardTitle>
          <p className="text-muted-foreground">
            You've been invited as a <strong>{roleDisplayName}</strong>
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter your first name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter your last name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Create a password"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account & Join Project'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/auth')}>
                Sign in instead
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteJoinPage;
