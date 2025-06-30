
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, User, Building2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { UnifiedInvitationService } from '@/services/unifiedInvitationService';
import type { InvitationStatusResult, PendingInvitation } from '@/services/unifiedInvitationService';

const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatusResult | null>(null);
  const [step, setStep] = useState<'enter_email' | 'show_status' | 'processing'>('enter_email');

  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid Invitation",
        description: "The invitation link is missing required information.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [token, navigate, toast]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setChecking(true);
    try {
      const status = await UnifiedInvitationService.checkInvitationStatus(email);
      setInvitationStatus(status);
      setStep('show_status');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check invitation status",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const handleAcceptInvitations = async () => {
    if (!invitationStatus || !token) return;

    setStep('processing');
    setLoading(true);

    try {
      // If user exists and is logged in, accept directly
      if (invitationStatus.user_exists && user) {
        const result = await UnifiedInvitationService.processInvitationAcceptance(
          email,
          token,
          user.id
        );

        if (result.success) {
          toast({
            title: "Success",
            description: result.message || "Invitations accepted successfully",
            variant: "default"
          });
          
          if (result.project_id) {
            navigate(`/project/${result.project_id}`);
          } else {
            navigate('/dashboard');
          }
        } else {
          throw new Error(result.error || 'Failed to accept invitations');
        }
      } else if (invitationStatus.user_exists && !user) {
        // User exists but not logged in - redirect to login
        toast({
          title: "Please Log In",
          description: "You need to log in to accept this invitation",
          variant: "default"
        });
        navigate('/auth');
      } else {
        // User doesn't exist - process for registration requirement
        const result = await UnifiedInvitationService.processInvitationAcceptance(
          email,
          token
        );

        if (result.requires_registration) {
          toast({
            title: "Account Required",
            description: "Please create an account to accept this invitation",
            variant: "default"
          });
          navigate('/auth');
        } else if (result.success) {
          toast({
            title: "Success", 
            description: result.message || "Invitation processed successfully",
            variant: "default"
          });
          navigate('/dashboard');
        } else {
          throw new Error(result.error || 'Failed to process invitation');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invitations",
        variant: "destructive"
      });
      setStep('show_status');
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (step === 'enter_email') {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-form-green rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-dm-sans">Project Invitation</CardTitle>
            <p className="text-muted-foreground">
              Enter your email address to check your invitation status
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full gomutuo-button-primary" 
                disabled={checking || !email.trim()}
              >
                {checking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Invitation'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'show_status' && invitationStatus) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-form-green rounded-full flex items-center justify-center mb-4">
              {invitationStatus.invitation_count > 0 ? (
                <CheckCircle className="h-6 w-6 text-white" />
              ) : (
                <AlertCircle className="h-6 w-6 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-dm-sans">
              {invitationStatus.invitation_count > 0 
                ? `${invitationStatus.invitation_count} Invitation${invitationStatus.invitation_count > 1 ? 's' : ''} Found`
                : 'No Pending Invitations'
              }
            </CardTitle>
            <p className="text-muted-foreground">
              {invitationStatus.user_exists 
                ? 'Account found for this email address'
                : 'No account found - you can create one after accepting'
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {invitationStatus.invitation_count > 0 ? (
              <>
                <div className="space-y-4">
                  {invitationStatus.pending_invitations.map((invitation: PendingInvitation) => (
                    <div key={invitation.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-form-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-form-green" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold text-lg">
                            {invitation.project_name || 'Project Invitation'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Role: {formatRole(invitation.role)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Invited by {invitation.inviter_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires in {Math.ceil(invitation.days_remaining)} days
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAcceptInvitations}
                    className="flex-1 gomutuo-button-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Accept ${invitationStatus.invitation_count > 1 ? 'All ' : ''}Invitation${invitationStatus.invitation_count > 1 ? 's' : ''}`
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStep('enter_email')}
                    disabled={loading}
                  >
                    Back
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No pending invitations found for this email address.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setStep('enter_email')}
                >
                  Try Different Email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-form-green rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-semibold font-dm-sans mb-2">Processing Invitation...</h2>
            <p className="text-muted-foreground">Please wait while we set up your access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default InvitePage;
