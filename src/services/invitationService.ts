
import { supabase } from '@/integrations/supabase/client';
import { createEmailInvitation } from './emailInvitationService';
import { validateAndProcessInvitationToken, checkInvitationProcessingStatus } from './invitationTokenService';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type Invitation = Database['public']['Tables']['invitations']['Row'];

// Email-based invitation creation (primary method)
export const createProjectInvitation = async (
  projectId: string,
  role: UserRole,
  email: string
): Promise<{ invitation: Invitation; success: boolean }> => {
  console.log('🎯 [INVITATION SERVICE] Creating email-based invitation');
  console.log('🎯 [INVITATION SERVICE] Parameters:', { projectId, role, email });
  
  try {
    const { invitation, success } = await createEmailInvitation(projectId, role, email);
    
    console.log('🎉 [INVITATION SERVICE] Invitation creation completed, success:', success);
    return { invitation, success };
    
  } catch (error) {
    console.error('❌ [INVITATION SERVICE] Invitation creation failed:', error);
    throw error;
  }
};

export const validateInvitationToken = async (encryptedToken: string): Promise<Invitation | null> => {
  const result = await validateAndProcessInvitationToken(encryptedToken);
  return result.invitation;
};

// Check if an invitation has been processed (used for verification)
export const checkInvitationStatus = async (invitationId: string): Promise<{
  processed: boolean;
  error?: string;
}> => {
  return checkInvitationProcessingStatus(invitationId);
};

// Legacy function - kept for backward compatibility but simplified
// The database trigger now handles most of this automatically
export const acceptInvitation = async (
  invitationId: string,
  userId: string
): Promise<void> => {
  console.log('🤝 [INVITATION SERVICE] Legacy acceptInvitation called - database trigger should handle this automatically');
  console.log('📋 [INVITATION SERVICE] Parameters:', { invitationId, userId });
  
  // Just check if the invitation was processed by the trigger
  const { processed, error } = await checkInvitationStatus(invitationId);
  
  if (error) {
    throw new Error(`Failed to verify invitation processing: ${error}`);
  }
  
  if (!processed) {
    console.warn('⚠️ [INVITATION SERVICE] Invitation not processed by trigger - this might indicate an issue');
    throw new Error('Invitation was not processed automatically. Please contact support.');
  }
  
  console.log('✅ [INVITATION SERVICE] Invitation was processed successfully by database trigger');
};
