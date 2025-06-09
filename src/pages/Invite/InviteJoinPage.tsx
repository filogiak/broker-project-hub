
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { decryptInvitationData, type InvitationData } from '@/utils/invitationCrypto';

const InviteJoinPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
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
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 [INVITE JOIN] Validating invitation token');
        
        // Decrypt token to get invitation data
        const data = decryptInvitationData(token);
        if (!data) {
          console.error('❌ [INVITE JOIN] Invalid or expired token');
          toast({
            title: "Invalid Invitation",
            description: "This invitation link is invalid or has expired.",
            variant: "destructive",
          });
          return;
        }

        // Verify invitation still exists and is valid in database
        const { data: invitation, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('encrypted_token', token)
          .eq('email', data.email)
          .is('used_at', null)
          .single();

        if (error || !invitation) {
          console.error('❌ [INVITE JOIN] Invitation not found or already used:', error);
          toast({
            title: "Invalid Invitation",
            description: "This invitation has already been used or is no longer valid.",
            variant: "destructive",
          });
          return;
        }

        console.log('✅ [INVITE JOIN] Valid invitation found:', data);
        setInvitationData(data);

      } catch (error) {
        console.error('❌ [INVITE JOIN] Error validating token:', error);
        toast({
          title: "Error",
          description: "Failed to validate invitation. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationData) return;

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
      console.log('👤 [INVITE JOIN] Creating account for:', invitationData.email);

      // Create user account (no email confirmation needed since they clicked the email link)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitationData.email,
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

      console.log('✅ [INVITE JOIN] Account created successfully');

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: invitationData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
        });

      if (profileError) {
        console.error('❌ [INVITE JOIN] Profile creation error:', profileError);
        // Continue - profile might already exist
      }

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: invitationData.role as any,
        });

      if (roleError) {
        console.error('❌ [INVITE JOIN] Role assignment error:', roleError);
        // Continue if role already exists
      }

      // Add to project
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitationData.projectId,
          user_id: authData.user.id,
          role: invitationData.role as any,
          invited_by: invitationData.invitedBy,
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('❌ [INVITE JOIN] Project member error:', memberError);
        // Continue if already a member
      }

      // Mark invitation as used
      const { error: inviteError } = await supabase
        .from('invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('encrypted_token', token);

      if (inviteError) {
        console.error('❌ [INVITE JOIN] Error marking invitation as used:', inviteError);
      }

      console.log('🎉 [INVITE JOIN] Complete signup flow successful');

      toast({
        title: "Welcome!",
        description: "Your account has been created successfully. Welcome to the project!",
      });

      // Redirect to project dashboard
      navigate(`/project/${invitationData.projectId}`);

    } catch (error) {
      console.error('❌ [INVITE JOIN] Complete signup error:', error);
      toast({
        title: "Signup Failed",
        description: "An error occurred while creating your account. Please try again.",
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
        </div>
      </div>
    );
  }

  if (!invitationData) {
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

  const roleDisplayName = invitationData.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

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
                value={invitationData.email}
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
