
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type Invitation = Database['public']['Tables']['invitations']['Row'];

export const createProjectInvitation = async (
  projectId: string,
  role: UserRole,
  email: string
): Promise<{ invitation: Invitation; invitationCode: string }> => {
  console.log('🎯 [INVITATION SERVICE] Starting invitation creation process');
  console.log('🎯 [INVITATION SERVICE] Input parameters:', { projectId, role, email });
  
  // Check authentication first
  console.log('🔐 [INVITATION SERVICE] Checking user session...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ [INVITATION SERVICE] Session error:', sessionError);
    throw new Error('Session error: ' + sessionError.message);
  }
  
  if (!session?.user) {
    console.error('❌ [INVITATION SERVICE] No authenticated user found');
    throw new Error('You must be logged in to create invitations');
  }

  console.log('✅ [INVITATION SERVICE] User authenticated:', {
    userId: session.user.id,
    userEmail: session.user.email
  });

  try {
    // Step 1: Generate invitation code
    console.log('🎲 [INVITATION SERVICE] Generating invitation code...');
    const { data: invitationCode, error: codeError } = await supabase
      .rpc('generate_invitation_code');

    if (codeError) {
      console.error('❌ [INVITATION SERVICE] Error from generate_invitation_code RPC:', codeError);
      throw new Error('Failed to generate invitation code: ' + codeError.message);
    }

    if (!invitationCode) {
      console.error('❌ [INVITATION SERVICE] No invitation code returned from RPC');
      throw new Error('Failed to generate invitation code: No code returned');
    }

    console.log('✅ [INVITATION SERVICE] Invitation code generated successfully:', invitationCode);

    // Step 2: Create the invitation record
    // The database RLS policies will automatically validate:
    // - User has brokerage_owner role
    // - User owns the project's brokerage
    console.log('📝 [INVITATION SERVICE] Creating invitation record in database...');
    
    const invitationData = {
      email,
      role,
      project_id: projectId,
      invited_by: session.user.id,
      invitation_code: invitationCode,
      token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    console.log('📝 [INVITATION SERVICE] Invitation data to insert:', invitationData);

    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (invitationError) {
      console.error('❌ [INVITATION SERVICE] Error inserting invitation:', {
        message: invitationError.message,
        details: invitationError.details,
        hint: invitationError.hint,
        code: invitationError.code
      });
      throw new Error('Failed to create invitation: ' + invitationError.message);
    }

    if (!invitation) {
      console.error('❌ [INVITATION SERVICE] No invitation returned from insert');
      throw new Error('Failed to create invitation: No invitation returned');
    }

    console.log('🎉 [INVITATION SERVICE] Invitation created successfully:', invitation);
    return { invitation, invitationCode };

  } catch (error) {
    console.error('❌ [INVITATION SERVICE] Complete invitation creation failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
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
