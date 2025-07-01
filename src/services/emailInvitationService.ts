
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type Invitation = Database['public']['Tables']['invitations']['Row'];

export const createEmailInvitation = async (
  projectId: string,
  role: UserRole,
  email: string
): Promise<{ invitation: Invitation; success: boolean }> => {
  console.log('📧 [EMAIL INVITATION] Starting email invitation creation');
  console.log('📧 [EMAIL INVITATION] Parameters:', { projectId, role, email });

  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Authentication required');
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, accepted_at, expires_at, encrypted_token')
      .eq('email', email)
      .eq('project_id', projectId)
      .eq('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    let invitation: Invitation;
    let shouldCreateNew = true;

    if (existingInvitation) {
      console.log('⚠️ [EMAIL INVITATION] Pending invitation already exists, will resend email:', existingInvitation.id);
      invitation = existingInvitation as Invitation;
      shouldCreateNew = false;
    }

    // Get current user profile for inviter name
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', session.user.id)
      .single();

    const inviterName = inviterProfile 
      ? `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() || inviterProfile.email
      : session.user.email || 'Someone';

    // Get project details
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new Error('Project not found');
    }

    if (shouldCreateNew) {
      // Generate encrypted token
      const { data: encryptedToken, error: tokenError } = await supabase
        .rpc('generate_encrypted_invitation_token');

      if (tokenError || !encryptedToken) {
        console.error('❌ [EMAIL INVITATION] Token generation failed:', tokenError);
        throw new Error('Failed to generate invitation token: ' + (tokenError?.message || 'Unknown error'));
      }

      console.log('✅ [EMAIL INVITATION] Token generated successfully');

      // Create invitation record
      const invitationData = {
        email,
        role,
        project_id: projectId,
        invited_by: session.user.id,
        encrypted_token: encryptedToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { data: newInvitation, error: invitationError } = await supabase
        .from('invitations')
        .insert(invitationData)
        .select()
        .single();

      if (invitationError) {
        console.error('❌ [EMAIL INVITATION] Failed to create invitation:', invitationError);
        
        // Handle unique constraint violation by fetching existing
        if (invitationError.code === '23505') {
          console.log('🔄 [EMAIL INVITATION] Unique constraint violation, fetching existing invitation');
          const { data: existingInvitationRetry } = await supabase
            .from('invitations')
            .select('*')
            .eq('email', email)
            .eq('project_id', projectId)
            .eq('accepted_at', null)
            .gt('expires_at', new Date().toISOString())
            .single();
          
          if (existingInvitationRetry) {
            invitation = existingInvitationRetry;
            console.log('✅ [EMAIL INVITATION] Using existing invitation for email send');
          } else {
            throw new Error('Failed to create or retrieve invitation');
          }
        } else {
          throw new Error('Failed to create invitation: ' + invitationError.message);
        }
      } else if (newInvitation) {
        invitation = newInvitation;
        console.log('✅ [EMAIL INVITATION] Invitation record created:', invitation.id);
      }
    }

    // Always try to send invitation email
    const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        invitationId: invitation.id,
        email,
        projectName: project.name,
        role,
        inviterName,
        encryptedToken: invitation.encrypted_token,
      },
    });

    if (emailError) {
      console.error('❌ [EMAIL INVITATION] Failed to send email:', emailError);
      // Don't throw here - invitation was created/exists, just email failed
      return { invitation, success: false };
    }

    console.log('🎉 [EMAIL INVITATION] Email invitation processed and sent successfully');
    return { invitation, success: true };

  } catch (error) {
    console.error('❌ [EMAIL INVITATION] Failed to create email invitation:', error);
    throw error;
  }
};
