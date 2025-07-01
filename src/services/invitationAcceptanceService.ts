
import { supabase } from '@/integrations/supabase/client';

export interface InvitationAcceptanceResult {
  success: boolean;
  error?: string;
  requiresRegistration?: boolean;
  invitationId?: string;
  email?: string;
  role?: string;
  projectId?: string;
  brokerageId?: string;
}

export const acceptBrokerageInvitation = async (
  invitationId: string
): Promise<InvitationAcceptanceResult> => {
  console.log('🎯 [INVITATION] Accepting brokerage invitation:', invitationId);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      throw new Error('Invitation not found or expired');
    }

    // Validate invitation is for current user
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (!profile || profile.email !== invitation.email) {
      throw new Error('Invitation email does not match current user');
    }

    // Check if invitation is for a brokerage
    if (!invitation.brokerage_id) {
      throw new Error('This is not a brokerage invitation');
    }

    // Check if user already has this role in the brokerage
    const { data: existingMember } = await supabase
      .from('brokerage_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('brokerage_id', invitation.brokerage_id)
      .eq('role', invitation.role)
      .maybeSingle();

    if (existingMember) {
      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitationId);

      return {
        success: true,
        error: 'You already have this role in the brokerage'
      };
    }

    // Create brokerage member record
    const { error: memberError } = await supabase
      .from('brokerage_members')
      .insert({
        user_id: user.id,
        brokerage_id: invitation.brokerage_id,
        role: invitation.role,
        invited_by: invitation.invited_by,
        joined_at: new Date().toISOString(),
        invited_at: invitation.created_at
      });

    if (memberError) {
      console.error('❌ [INVITATION] Failed to create brokerage member:', memberError);
      throw new Error('Failed to join brokerage: ' + memberError.message);
    }

    // Add user role if not exists (for backward compatibility)
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: invitation.role
      });

    // Ignore role error if it already exists
    if (roleError && !roleError.message.includes('duplicate')) {
      console.warn('⚠️ [INVITATION] Failed to add user role:', roleError);
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (updateError) {
      console.error('❌ [INVITATION] Failed to mark invitation as accepted:', updateError);
    }

    console.log('✅ [INVITATION] Brokerage invitation accepted successfully');
    return {
      success: true,
      brokerageId: invitation.brokerage_id
    };

  } catch (error) {
    console.error('❌ [INVITATION] Failed to accept brokerage invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
