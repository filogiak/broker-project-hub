
import { supabase } from '@/integrations/supabase/client';
import { createEmailInvitation } from './emailInvitationService';
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
  console.log('🔍 [INVITATION SERVICE] Starting invitation token validation');
  console.log('🔍 [INVITATION SERVICE] Raw token received:', encryptedToken);
  console.log('🔍 [INVITATION SERVICE] Token length:', encryptedToken?.length);
  console.log('🔍 [INVITATION SERVICE] Token has special chars:', /[+/=]/.test(encryptedToken));
  
  if (!encryptedToken) {
    console.warn('⚠️ [INVITATION SERVICE] No token provided');
    return null;
  }

  // Try multiple URL decoding approaches
  const tokenVariants = [
    encryptedToken, // Original
    decodeURIComponent(encryptedToken), // Standard decode
    encryptedToken.replace(/ /g, '+'), // Replace spaces with +
    decodeURIComponent(encryptedToken.replace(/ /g, '+')), // Decode after fixing +
  ];

  console.log('🔄 [INVITATION SERVICE] Testing token variants:', tokenVariants.map((t, i) => 
    `${i}: ${t.substring(0, 20)}... (${t.length} chars)`
  ));

  try {
    console.log('📞 [INVITATION SERVICE] Querying invitations table for token validation...');
    
    // Try exact match first with all variants
    for (let i = 0; i < tokenVariants.length; i++) {
      const variant = tokenVariants[i];
      console.log(`🔍 [INVITATION SERVICE] Testing variant ${i}: ${variant.substring(0, 20)}...`);
      
      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('encrypted_token', variant)
        .maybeSingle();

      if (error) {
        console.error(`❌ [INVITATION SERVICE] Database error testing variant ${i}:`, error.message);
        continue;
      }

      if (invitation) {
        console.log(`✅ [INVITATION SERVICE] Found invitation with variant ${i}`);
        return validateInvitationExpiry(invitation);
      }
    }

    console.warn('⚠️ [INVITATION SERVICE] No invitation found for any token variant');
    return null;

  } catch (error) {
    console.error('❌ [INVITATION SERVICE] Token validation failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};

// Helper function to validate expiry and acceptance status
const validateInvitationExpiry = (invitation: Invitation): Invitation | null => {
  console.log('📋 [INVITATION SERVICE] Invitation found via token:', {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    expires_at: invitation.expires_at,
    accepted_at: invitation.accepted_at,
    project_id: invitation.project_id
  });

  // Check if invitation has expired
  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);
  
  if (expiresAt <= now) {
    console.warn('⚠️ [INVITATION SERVICE] Invitation has expired:', {
      expires_at: invitation.expires_at,
      current_time: now.toISOString()
    });
    return null;
  }

  // Note: We no longer check accepted_at since users might need to validate 
  // tokens during the signup process even if the trigger will mark it as accepted

  console.log('✅ [INVITATION SERVICE] Valid invitation found via token:', {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    project_id: invitation.project_id
  });
  
  return invitation;
};

// Check if an invitation has been processed (used for verification)
export const checkInvitationStatus = async (invitationId: string): Promise<{
  processed: boolean;
  error?: string;
}> => {
  try {
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('accepted_at')
      .eq('id', invitationId)
      .single();

    if (error) {
      console.error('❌ [INVITATION SERVICE] Error checking invitation status:', error);
      return { processed: false, error: error.message };
    }

    return { processed: !!invitation.accepted_at };
  } catch (error) {
    console.error('❌ [INVITATION SERVICE] Failed to check invitation status:', error);
    return { 
      processed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
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
