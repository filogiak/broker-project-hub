
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { createProjectInvitation } from '@/services/invitationService';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onMemberAdded: () => void;
}

const AddMemberModal = ({ isOpen, onClose, projectId, onMemberAdded }: AddMemberModalProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('real_estate_agent');
  const [isLoading, setIsLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const { toast } = useToast();

  const roleOptions = [
    { value: 'real_estate_agent' as UserRole, label: 'Real Estate Agent' },
    { value: 'broker_assistant' as UserRole, label: 'Broker Assistant' },
    { value: 'mortgage_applicant' as UserRole, label: 'Customer/Mortgage Applicant' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [ADD MEMBER MODAL] Form submission started');
    console.log('🚀 [ADD MEMBER MODAL] Form data:', { email: email.trim(), role, projectId });
    
    if (!email.trim()) {
      console.warn('⚠️ [ADD MEMBER MODAL] Email validation failed - empty email');
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.warn('⚠️ [ADD MEMBER MODAL] Email validation failed - invalid format');
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ [ADD MEMBER MODAL] Form validation passed');
    setIsLoading(true);

    try {
      console.log('📞 [ADD MEMBER MODAL] Calling createProjectInvitation service...');
      const { invitationCode: code } = await createProjectInvitation(projectId, role, email.trim());
      
      console.log('🎉 [ADD MEMBER MODAL] Invitation creation successful, code:', code);
      setInvitationCode(code);
      
      toast({
        title: "Invitation Created",
        description: `Invitation code ${code} has been generated for ${email}`,
      });

      console.log('🔄 [ADD MEMBER MODAL] Calling onMemberAdded callback');
      onMemberAdded();

    } catch (error) {
      console.error('❌ [ADD MEMBER MODAL] Invitation creation error:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      });
      
      let errorMessage = "Failed to create invitation";
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          errorMessage = "Authentication failed. Please log in again and try.";
        } else if (error.message.includes('session')) {
          errorMessage = "Session expired. Please refresh the page and try again.";
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
      console.log('🏁 [ADD MEMBER MODAL] Form submission completed, setting loading to false');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 [ADD MEMBER MODAL] Modal closing, resetting state');
    setEmail('');
    setRole('real_estate_agent');
    setInvitationCode(null);
    onClose();
  };

  const copyInvitationCode = () => {
    if (invitationCode) {
      console.log('📋 [ADD MEMBER MODAL] Copying invitation code to clipboard:', invitationCode);
      navigator.clipboard.writeText(invitationCode);
      toast({
        title: "Copied",
        description: "Invitation code copied to clipboard",
      });
    } else {
      console.warn('⚠️ [ADD MEMBER MODAL] Attempted to copy null invitation code');
    }
  };

  const copyInviteLink = () => {
    if (invitationCode) {
      const inviteLink = `${window.location.origin}/invite`;
      console.log('📋 [ADD MEMBER MODAL] Copying invitation link to clipboard:', inviteLink);
      navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Link Copied",
        description: "Invitation link copied to clipboard",
      });
    }
  };

  console.log('🎨 [ADD MEMBER MODAL] Rendering modal with state:', { 
    isOpen, 
    isLoading, 
    invitationCode: !!invitationCode,
    email,
    role 
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Project Member</DialogTitle>
        </DialogHeader>

        {!invitationCode ? (
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Invitation'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Invitation Created!</h3>
              <p className="text-muted-foreground">
                Share this 6-digit code with {email}:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-2xl font-mono font-bold tracking-wider">
                  {invitationCode}
                </div>
              </div>
              <div className="flex space-x-2 justify-center">
                <Button onClick={copyInvitationCode} variant="outline" size="sm">
                  Copy Code
                </Button>
                <Button onClick={copyInviteLink} variant="outline" size="sm">
                  Copy Invite Link
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                The invited user should visit: <strong>{window.location.origin}/invite</strong>
              </p>
              <p>
                And enter the code above to join the project.
              </p>
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

export default AddMemberModal;
