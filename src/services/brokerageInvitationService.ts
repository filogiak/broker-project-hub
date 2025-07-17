import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface BrokerageInvitationResult {
  success: boolean;
  error?: string;
  invitationId?: string;
}

interface CreateBrokerageInvitationFunctionResult {
  success: boolean;
  invitation_id?: string;
  encrypted_token?: string;
  error?: string;
  message?: string;
}

export const createBrokerageInvitation = async (
  brokerageId: string,
  email: string,
  role: UserRole
): Promise<BrokerageInvitationResult> => {
  console.log('📧 [BROKERAGE INVITATION] Creating brokerage invitation:', { brokerageId, email, role });

  try {
    // Get current user session for email sending
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Authentication required');
    }

    // Validate email format
    if (!email || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }

    // Use the secure database function to create the invitation
    const { data: rawResult, error: functionError } = await supabase
      .rpc('create_brokerage_invitation', {
        p_brokerage_id: brokerageId,
        p_email: email.toLowerCase().trim(),
        p_role: role
      });

    if (functionError) {
      console.error('❌ [BROKERAGE INVITATION] Function error:', functionError);
      throw new Error(functionError.message || 'Failed to create invitation');
    }

    // Cast the result to our expected type
    const result = rawResult as unknown as CreateBrokerageInvitationFunctionResult;

    if (!result || !result.success) {
      const errorMessage = result?.error || 'Failed to create invitation';
      console.error('❌ [BROKERAGE INVITATION] Function returned error:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }

    console.log('✅ [BROKERAGE INVITATION] Invitation created:', result.invitation_id);

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
        invitationId: result.invitation_id,
        email: email.toLowerCase().trim(),
        projectName: null, // This is a brokerage invitation
        role,
        inviterName,
        encryptedToken: result.encrypted_token,
        brokerageId
      },
    });

    if (emailError) {
      console.error('❌ [BROKERAGE INVITATION] Failed to send email:', emailError);
      // Don't throw here - invitation was created, just email failed
      return {
        success: true,
        invitationId: result.invitation_id,
        error: 'Invitation created but email failed to send'
      };
    }

    console.log('🎉 [BROKERAGE INVITATION] Brokerage invitation sent successfully');
    return { 
      success: true, 
      invitationId: result.invitation_id 
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
