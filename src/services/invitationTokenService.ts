
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

export const validateAndProcessInvitationToken = async (encryptedToken: string): Promise<{
  invitation: Invitation | null;
  error?: string;
  expired?: boolean;
  alreadyUsed?: boolean;
}> => {
  console.log('🔍 [INVITATION TOKEN] Starting token validation process...');
  console.log('🔍 [INVITATION TOKEN] Token received:', encryptedToken?.substring(0, 20) + '...');
  
  if (!encryptedToken?.trim()) {
    console.warn('⚠️ [INVITATION TOKEN] No token provided');
    return { invitation: null, error: 'No invitation token provided' };
  }

  // Try multiple URL decoding approaches to handle different encoding scenarios
  const tokenVariants = [
    encryptedToken.trim(),
    decodeURIComponent(encryptedToken.trim()),
    encryptedToken.replace(/ /g, '+').trim(),
    decodeURIComponent(encryptedToken.replace(/ /g, '+').trim()),
    encryptedToken.replace(/\s/g, '').trim(), // Remove all whitespace
  ];

  console.log('🔄 [INVITATION TOKEN] Testing token variants:', tokenVariants.length);

  try {
    // Try each token variant
    for (let i = 0; i < tokenVariants.length; i++) {
      const variant = tokenVariants[i];
      if (!variant) continue;
      
      console.log(`🔍 [INVITATION TOKEN] Testing variant ${i + 1}: ${variant.substring(0, 20)}... (${variant.length} chars)`);
      
      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('encrypted_token', variant)
        .maybeSingle();

      if (error) {
        console.error(`❌ [INVITATION TOKEN] Database error testing variant ${i + 1}:`, error.message);
        continue;
      }

      if (invitation) {
        console.log(`✅ [INVITATION TOKEN] Found invitation with variant ${i + 1}`);
        return validateInvitationStatus(invitation);
      }
    }

    console.warn('⚠️ [INVITATION TOKEN] No invitation found for any token variant');
    return { 
      invitation: null, 
      error: 'Invalid invitation link. The invitation may have been revoked or the link may be corrupted.' 
    };

  } catch (error) {
    console.error('❌ [INVITATION TOKEN] Token validation failed:', error);
    return { 
      invitation: null, 
      error: error instanceof Error ? error.message : 'Failed to validate invitation token' 
    };
  }
};

const validateInvitationStatus = (invitation: Invitation): {
  invitation: Invitation | null;
  error?: string;
  expired?: boolean;
  alreadyUsed?: boolean;
} => {
  console.log('📋 [INVITATION TOKEN] Validating invitation status:', {
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
    console.warn('⚠️ [INVITATION TOKEN] Invitation has expired:', {
      expires_at: invitation.expires_at,
      current_time: now.toISOString()
    });
    return { 
      invitation: null, 
      expired: true,
      error: 'This invitation has expired. Please request a new invitation.' 
    };
  }

  // Check if invitation has already been accepted
  if (invitation.accepted_at) {
    console.warn('⚠️ [INVITATION TOKEN] Invitation already accepted:', {
      accepted_at: invitation.accepted_at
    });
    return { 
      invitation: null, 
      alreadyUsed: true,
      error: 'This invitation has already been used. If you need access, please request a new invitation.' 
    };
  }

  console.log('✅ [INVITATION TOKEN] Valid invitation found:', {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    project_id: invitation.project_id
  });
  
  return { invitation };
};

export const checkInvitationProcessingStatus = async (invitationId: string): Promise<{
  processed: boolean;
  error?: string;
}> => {
  try {
    console.log('🔍 [INVITATION TOKEN] Checking processing status for invitation:', invitationId);
    
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('accepted_at, email')
      .eq('id', invitationId)
      .single();

    if (error) {
      console.error('❌ [INVITATION TOKEN] Error checking invitation status:', error);
      return { processed: false, error: error.message };
    }

    const processed = !!invitation.accepted_at;
    console.log(`${processed ? '✅' : '⏳'} [INVITATION TOKEN] Invitation processing status:`, {
      processed,
      accepted_at: invitation.accepted_at,
      email: invitation.email
    });

    return { processed };
  } catch (error) {
    console.error('❌ [INVITATION TOKEN] Failed to check invitation status:', error);
    return { 
      processed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
