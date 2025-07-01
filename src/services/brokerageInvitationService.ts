
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface BrokerageInvitationResult {
  success: boolean;
  error?: string;
  invitationId?: string;
}

export const createBrokerageInvitation = async (
  brokerageId: string,
  email: string,
  role: UserRole
): Promise<BrokerageInvitationResult> => {
  console.log('📧 [BROKERAGE INVITATION] Creating brokerage invitation:', { brokerageId, email, role });

  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Authentication required');
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, accepted_at, expires_at')
      .eq('email', email)
      .eq('brokerage_id', brokerageId)
      .eq('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      console.log('⚠️ [BROKERAGE INVITATION] Pending invitation already exists:', existingInvitation.id);
      return {
        success: false,
        error: 'A pending invitation already exists for this email'
      };
    }

    // Generate encrypted token
    const { data: encryptedToken, error: tokenError } = await supabase
      .rpc('generate_encrypted_invitation_token');

    if (tokenError || !encryptedToken) {
      console.error('❌ [BROKERAGE INVITATION] Token generation failed:', tokenError);
      throw new Error('Failed to generate invitation token');
    }

    // Create invitation record
    const invitationData = {
      email,
      role,
      brokerage_id: brokerageId,
      invited_by: session.user.id,
      encrypted_token: encryptedToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (invitationError) {
      console.error('❌ [BROKERAGE INVITATION] Failed to create invitation:', invitationError);
      throw new Error('Failed to create invitation: ' + invitationError.message);
    }

    console.log('✅ [BROKERAGE INVITATION] Invitation created:', invitation.id);

    // Get current user profile for inviter name
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', session.user.id)
      .single();

    const inviterName = inviterProfile 
      ? `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() || inviterProfile.email
      : session.user.email || 'Someone';

    // Send invitation email
    const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        invitationId: invitation.id,
        email,
        projectName: null, // This is a brokerage invitation
        role,
        inviterName,
        encryptedToken,
        brokerageId
      },
    });

    if (emailError) {
      console.error('❌ [BROKERAGE INVITATION] Failed to send email:', emailError);
      // Don't throw here - invitation was created, just email failed
      return {
        success: true,
        invitationId: invitation.id,
        error: 'Invitation created but email failed to send'
      };
    }

    console.log('🎉 [BROKERAGE INVITATION] Brokerage invitation sent successfully');
    return { 
      success: true, 
      invitationId: invitation.id 
    };

  } catch (error) {
    console.error('❌ [BROKERAGE INVITATION] Failed to create brokerage invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const resendBrokerageInvitation = async (invitationId: string): Promise<BrokerageInvitationResult> => {
  console.log('🔄 [BROKERAGE INVITATION] Resending brokerage invitation:', invitationId);

  try {
    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select(`
        *,
        profiles!invitations_invited_by_fkey(first_name, last_name, email)
      `)
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      throw new Error('Invitation not found');
    }

    const inviterName = invitation.profiles 
      ? `${invitation.profiles.first_name || ''} ${invitation.profiles.last_name || ''}`.trim() || invitation.profiles.email
      : 'Someone';

    // Send invitation email
    const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        invitationId: invitation.id,
        email: invitation.email,
        projectName: null,
        role: invitation.role,
        inviterName,
        encryptedToken: invitation.encrypted_token,
        brokerageId: invitation.brokerage_id
      },
    });

    if (emailError) {
      console.error('❌ [BROKERAGE INVITATION] Failed to resend email:', emailError);
      throw new Error('Failed to resend invitation email');
    }

    console.log('✅ [BROKERAGE INVITATION] Invitation resent successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ [BROKERAGE INVITATION] Failed to resend invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const cancelBrokerageInvitation = async (invitationId: string): Promise<BrokerageInvitationResult> => {
  console.log('🗑️ [BROKERAGE INVITATION] Cancelling brokerage invitation:', invitationId);

  try {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('❌ [BROKERAGE INVITATION] Failed to cancel invitation:', error);
      throw new Error('Failed to cancel invitation');
    }

    console.log('✅ [BROKERAGE INVITATION] Invitation cancelled successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ [BROKERAGE INVITATION] Failed to cancel invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
