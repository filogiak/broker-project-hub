
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type Invitation = Database['public']['Tables']['invitations']['Row'];

export const createProjectInvitation = async (
  projectId: string,
  role: UserRole,
  email: string
): Promise<{ invitation: Invitation; invitationCode: string }> => {
  console.log('🎯 Creating project invitation:', { projectId, role, email });
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('You must be logged in to create invitations');
  }

  try {
    // Generate invitation code using the database function
    const { data: invitationCode, error: codeError } = await supabase
      .rpc('generate_invitation_code');

    if (codeError || !invitationCode) {
      console.error('❌ Error generating invitation code:', codeError);
      throw new Error('Failed to generate invitation code');
    }

    console.log('✅ Generated invitation code:', invitationCode);

    // Create the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        project_id: projectId,
        invited_by: session.user.id,
        invitation_code: invitationCode,
        token: crypto.randomUUID(), // Generate a unique token
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      })
      .select()
      .single();

    if (invitationError || !invitation) {
      console.error('❌ Error creating invitation:', invitationError);
      throw new Error('Failed to create invitation');
    }

    console.log('🎉 Invitation created successfully:', invitation);
    return { invitation, invitationCode };

  } catch (error) {
    console.error('❌ Invitation creation failed:', error);
    throw error instanceof Error ? error : new Error('Failed to create invitation');
  }
};

export const validateInvitationCode = async (code: string): Promise<Invitation | null> => {
  console.log('🔍 Validating invitation code:', code);
  
  try {
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitation_code', code)
      .gt('expires_at', new Date().toISOString())
      .is('accepted_at', null)
      .single();

    if (error) {
      console.error('❌ Error validating invitation code:', error);
      return null;
    }

    console.log('✅ Valid invitation found:', invitation);
    return invitation;

  } catch (error) {
    console.error('❌ Invitation validation failed:', error);
    return null;
  }
};

export const acceptInvitation = async (
  invitationId: string,
  userId: string
): Promise<void> => {
  console.log('🤝 Accepting invitation:', { invitationId, userId });
  
  try {
    // Get the invitation details first
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      console.error('❌ Error fetching invitation:', fetchError);
      throw new Error('Invitation not found');
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (updateError) {
      console.error('❌ Error accepting invitation:', updateError);
      throw new Error('Failed to accept invitation');
    }

    // Add user to project members if project invitation
    if (invitation.project_id) {
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: userId,
          role: invitation.role,
          invited_by: invitation.invited_by,
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('❌ Error adding project member:', memberError);
        throw new Error('Failed to add to project');
      }
    }

    console.log('🎉 Invitation accepted successfully');

  } catch (error) {
    console.error('❌ Failed to accept invitation:', error);
    throw error instanceof Error ? error : new Error('Failed to accept invitation');
  }
};
