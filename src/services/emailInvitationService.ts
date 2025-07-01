
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
      .select('id, accepted_at, expires_at')
      .eq('email', email)
      .eq('project_id', projectId)
      .eq('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      console.log('⚠️ [EMAIL INVITATION] Pending invitation already exists:', existingInvitation.id);
      throw new Error('An active invitation already exists for this email and project');
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

    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (invitationError) {
      console.error('❌ [EMAIL INVITATION] Failed to create invitation:', invitationError);
      
      // Handle unique constraint violation
      if (invitationError.code === '23505') {
        throw new Error('An invitation for this email and project already exists');
      }
      
      throw new Error('Failed to create invitation: ' + invitationError.message);
    }

    if (!invitation) {
      throw new Error('No invitation record returned after creation');
    }

    console.log('✅ [EMAIL INVITATION] Invitation record created:', invitation.id);

    // Send invitation email via edge function
    const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        invitationId: invitation.id,
        email,
        projectName: project.name,
        role,
        inviterName,
        encryptedToken,
      },
    });

    if (emailError) {
      console.error('❌ [EMAIL INVITATION] Failed to send email:', emailError);
      // Don't throw here - invitation was created, just email failed
      return { invitation, success: false };
    }

    console.log('🎉 [EMAIL INVITATION] Email invitation created and sent successfully');
    return { invitation, success: true };

  } catch (error) {
    console.error('❌ [EMAIL INVITATION] Failed to create email invitation:', error);
    throw error;
  }
};
