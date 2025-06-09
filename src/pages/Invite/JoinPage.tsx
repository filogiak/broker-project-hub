
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, CheckCircle, User, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

interface SignupFormData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const JoinPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 [JOIN PAGE] Validating invitation token:', token);
        
        const { data: invitationData, error: invitationError } = await supabase
          .from('invitations')
          .select('*')
          .eq('invitation_token', token)
          .maybeSingle();

        if (invitationError) {
          console.error('❌ [JOIN PAGE] Database error:', invitationError);
          setError('Failed to validate invitation');
          return;
        }

        if (!invitationData) {
          console.warn('⚠️ [JOIN PAGE] No invitation found for token');
          setError('Invalid or expired invitation');
          return;
        }

        // Check if invitation has expired
        const now = new Date();
        const expiresAt = new Date(invitationData.expires_at);
        
        if (expiresAt <= now) {
          console.warn('⚠️ [JOIN PAGE] Invitation has expired');
          setError('This invitation has expired');
          return;
        }

        // Check if invitation has already been accepted
        if (invitationData.accepted_at) {
          console.warn('⚠️ [JOIN PAGE] Invitation already accepted');
          setError('This invitation has already been used');
          return;
        }

        console.log('✅ [JOIN PAGE] Valid invitation found:', invitationData);
        setInvitation(invitationData);

      } catch (error) {
        console.error('❌ [JOIN PAGE] Validation error:', error);
        setError('Failed to validate invitation');
      } finally {
        setLoading(false);
      }
    };

    validateInvitation();
  }, [token]);

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) return;

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      console.log('🚀 [JOIN PAGE] Starting signup process...');

      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
          emailRedirectTo: undefined // Skip email verification
        }
      });

      if (authError) {
        console.error('❌ [JOIN PAGE] Auth error:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('✅ [JOIN PAGE] User account created:', authData.user.id);

      // Step 2: Update profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || null,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('❌ [JOIN PAGE] Profile update error:', profileError);
        // Don't throw error, profile might already be created by trigger
      }

      // Step 3: Assign user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: invitation.role
        });

      if (roleError && roleError.code !== '23505') { // Ignore duplicate role error
        console.error('❌ [JOIN PAGE] Role assignment error:', roleError);
        throw new Error('Failed to assign user role');
      }

      // Step 4: Add to project if applicable
      if (invitation.project_id) {
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: invitation.project_id,
            user_id: authData.user.id,
            role: invitation.role,
            invited_by: invitation.invited_by,
            joined_at: new Date().toISOString(),
          });

        if (memberError && memberError.code !== '23505') { // Ignore duplicate member error
          console.error('❌ [JOIN PAGE] Project membership error:', memberError);
          throw new Error('Failed to add to project');
        }
      }

      // Step 5: Mark invitation as accepted
      const { error: invitationUpdateError } = await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (invitationUpdateError) {
        console.error('❌ [JOIN PAGE] Invitation update error:', invitationUpdateError);
        // Don't throw error as core functionality worked
      }

      console.log('🎉 [JOIN PAGE] Signup process completed successfully');

      toast({
        title: "Welcome!",
        description: "Your account has been created successfully. You're now logged in.",
      });

      // Redirect to appropriate page
      if (invitation.project_id) {
        navigate(`/project/${invitation.project_id}`);
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('❌ [JOIN PAGE] Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const roleDisplay = invitation?.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Validating Invitation</CardTitle>
            <p className="text-muted-foreground">Please wait while we verify your invitation...</p>
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
            <CardTitle className="text-2xl text-destructive">Invalid Invitation</CardTitle>
            <p className="text-muted-foreground">{error}</p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Complete Your Signup</CardTitle>
          <p className="text-muted-foreground">
            You've been invited to join as a <strong>{roleDisplay}</strong>
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-muted p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{invitation?.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Create a password (min. 6 characters)"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Create Account & Join
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By creating an account, you're automatically joining the team and accepting the invitation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinPage;
