
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { createEmailInvitation } from '@/services/emailInvitationService';
import { Mail, Copy, ExternalLink, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface EmailInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onMemberAdded: () => void;
}

const EmailInvitationModal = ({ isOpen, onClose, projectId, onMemberAdded }: EmailInvitationModalProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('real_estate_agent');
  const [isLoading, setIsLoading] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const roleOptions = [
    { value: 'real_estate_agent' as UserRole, label: 'Real Estate Agent' },
    { value: 'broker_assistant' as UserRole, label: 'Broker Assistant' },
    { value: 'mortgage_applicant' as UserRole, label: 'Customer/Mortgage Applicant' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [EMAIL INVITATION MODAL] Form submission started');
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('📞 [EMAIL INVITATION MODAL] Calling createEmailInvitation service...');
      const { invitation, invitationUrl: url } = await createEmailInvitation(projectId, role, email.trim());
      
      console.log('🎉 [EMAIL INVITATION MODAL] Invitation creation successful');
      setInvitationUrl(url);
      setInvitationSent(true);
      
      toast({
        title: "Invitation Sent!",
        description: `An invitation email has been sent to ${email}`,
      });

      onMemberAdded();

    } catch (error) {
      console.error('❌ [EMAIL INVITATION MODAL] Invitation creation error:', error);
      
      let errorMessage = "Failed to send invitation";
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          errorMessage = "Authentication failed. Please log in again and try.";
        } else if (error.message.includes('permission')) {
          errorMessage = "You don't have permission to invite members to this project.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 [EMAIL INVITATION MODAL] Modal closing, resetting state');
    setEmail('');
    setRole('real_estate_agent');
    setInvitationSent(false);
    setInvitationUrl(null);
    onClose();
  };

  const copyInvitationUrl = () => {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl);
      toast({
        title: "Link Copied",
        description: "Invitation link copied to clipboard",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Add Project Member
          </DialogTitle>
        </DialogHeader>

        {!invitationSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Member Role</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
                {roleOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                📧 An invitation email will be sent to the user with a direct signup link. 
                No verification codes needed!
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Invitation Sent!</h3>
              <p className="text-muted-foreground">
                We've sent an invitation email to <strong>{email}</strong>
              </p>
            </div>

            {invitationUrl && (
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Backup invitation link:</p>
                  <div className="text-xs font-mono break-all bg-background p-2 rounded border">
                    {invitationUrl}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={copyInvitationUrl} variant="outline" size="sm" className="flex-1">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button 
                    onClick={() => window.open(invitationUrl, '_blank')} 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Link
                  </Button>
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
              <p>✅ The user will receive a professional invitation email</p>
              <p>✅ They can create their account directly from the email</p>
              <p>✅ No verification codes or complex steps required</p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailInvitationModal;
