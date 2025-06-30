import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { UnifiedInvitationService } from '@/services/unifiedInvitationService';
import { supabase } from '@/integrations/supabase/client';
import { Mail, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type ApplicantCount = Database['public']['Enums']['applicant_count'];

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
  const [emailSent, setEmailSent] = useState(false);
  const [invitationSuccess, setInvitationSuccess] = useState(false);
  const [projectApplicantCount, setProjectApplicantCount] = useState<ApplicantCount | null>(null);
  const [currentApplicantCount, setCurrentApplicantCount] = useState(0);
  const { toast } = useToast();

  const roleOptions = [
    { value: 'real_estate_agent' as UserRole, label: 'Real Estate Agent' },
    { value: 'broker_assistant' as UserRole, label: 'Broker Assistant' },
    { value: 'mortgage_applicant' as UserRole, label: 'Customer/Mortgage Applicant' },
  ];

  useEffect(() => {
    const loadProjectInfo = async () => {
      if (!isOpen || !projectId) return;

      try {
        // Get project applicant count
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('applicant_count')
          .eq('id', projectId)
          .single();

        if (projectError) {
          console.error('Error loading project:', projectError);
          return;
        }

        setProjectApplicantCount(projectData.applicant_count);

        // Count current mortgage applicants
        const { data: membersData, error: membersError } = await supabase
          .from('project_members')
          .select('id')
          .eq('project_id', projectId)
          .eq('role', 'mortgage_applicant');

        if (membersError) {
          console.error('Error counting applicants:', membersError);
          return;
        }

        setCurrentApplicantCount(membersData?.length || 0);

      } catch (error) {
        console.error('Error loading project info:', error);
      }
    };

    loadProjectInfo();
  }, [isOpen, projectId]);

  const getApplicantInfo = () => {
    if (!projectApplicantCount) return null;

    const maxApplicants = projectApplicantCount === 'one_applicant' ? 1 : 
                         projectApplicantCount === 'two_applicants' ? 2 : 3;

    const canAddApplicant = currentApplicantCount < maxApplicants;
    const nextDesignation = projectApplicantCount === 'one_applicant' ? 'solo_applicant' :
                           currentApplicantCount === 0 ? 'applicant_one' : 'applicant_two';

    return {
      maxApplicants,
      canAddApplicant,
      nextDesignation,
      currentCount: currentApplicantCount
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [ADD MEMBER MODAL] Form submission started (unified service)');
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

    // Check if trying to add mortgage applicant when limit reached
    const applicantInfo = getApplicantInfo();
    if (role === 'mortgage_applicant' && applicantInfo && !applicantInfo.canAddApplicant) {
      toast({
        title: "Cannot Add Applicant",
        description: `This project already has the maximum number of applicants (${applicantInfo.maxApplicants})`,
        variant: "destructive",
      });
      return;
    }

    console.log('✅ [ADD MEMBER MODAL] Form validation passed');
    setIsLoading(true);

    try {
      console.log('📞 [ADD MEMBER MODAL] Calling UnifiedInvitationService.createInvitation...');
      const result = await UnifiedInvitationService.createInvitation(projectId, role, email.trim());
      
      console.log('🎉 [ADD MEMBER MODAL] Invitation creation completed, success:', result.success);
      
      setEmailSent(true);
      setInvitationSuccess(result.success);
      
      if (result.success) {
        toast({
          title: "Invitation Sent",
          description: `Invitation email has been sent to ${email}`,
        });
      } else {
        toast({
          title: "Invitation Created",
          description: result.error || `Invitation created but email failed to send. Please contact ${email} directly.`,
          variant: "destructive",
        });
      }

      console.log('🔄 [ADD MEMBER MODAL] Calling onMemberAdded callback');
      onMemberAdded();

    } catch (error) {
      console.error('❌ [ADD MEMBER MODAL] Invitation creation error:', error);
      
      let errorMessage = "Failed to create invitation";
      
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
      console.log('🏁 [ADD MEMBER MODAL] Form submission completed');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 [ADD MEMBER MODAL] Modal closing, resetting state');
    setEmail('');
    setRole('real_estate_agent');
    setEmailSent(false);
    setInvitationSuccess(false);
    onClose();
  };

  const applicantInfo = getApplicantInfo();

  console.log('🎨 [ADD MEMBER MODAL] Rendering modal with state:', { 
    isOpen, 
    isLoading, 
    emailSent,
    invitationSuccess,
    email,
    role,
    projectApplicantCount,
    currentApplicantCount
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Project Member</DialogTitle>
        </DialogHeader>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project Applicant Info */}
            {projectApplicantCount && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Project Configuration: {projectApplicantCount.replace(/_/g, ' ')}
                  {applicantInfo && (
                    <div className="mt-1">
                      Current applicants: {applicantInfo.currentCount} / {applicantInfo.maxApplicants}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

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
                {roleOptions.map((option) => {
                  const isApplicantDisabled = option.value === 'mortgage_applicant' && 
                                            applicantInfo && !applicantInfo.canAddApplicant;
                  
                  return (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option.value} 
                        id={option.value}
                        disabled={isApplicantDisabled}
                      />
                      <Label 
                        htmlFor={option.value} 
                        className={`cursor-pointer ${isApplicantDisabled ? 'text-muted-foreground' : ''}`}
                      >
                        {option.label}
                        {option.value === 'mortgage_applicant' && applicantInfo && (
                          <span className="text-sm text-muted-foreground ml-2">
                            {applicantInfo.canAddApplicant 
                              ? `(will be assigned as ${applicantInfo.nextDesignation.replace(/_/g, ' ')})`
                              : '(maximum reached)'
                            }
                          </span>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending Invitation...' : 'Send Email Invitation'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <div className="flex justify-center">
                {invitationSuccess ? (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                ) : (
                  <Mail className="h-12 w-12 text-yellow-500" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold">
                {invitationSuccess ? 'Invitation Sent!' : 'Invitation Created'}
              </h3>
              
              <p className="text-muted-foreground">
                {invitationSuccess ? (
                  <>An invitation email has been sent to <strong>{email}</strong></>
                ) : (
                  <>Invitation created for <strong>{email}</strong> but email delivery failed</>
                )}
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              {invitationSuccess ? (
                <p>
                  The invited user will receive an email with a direct link to join the project.
                  They'll be able to create their account and join in one simple step.
                </p>
              ) : (
                <p>
                  Please contact <strong>{email}</strong> directly and ask them to visit the
                  invitation page to join the project.
                </p>
              )}
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
