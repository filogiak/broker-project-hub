
import { supabase } from '@/integrations/supabase/client';
import { debugAuthState, validateSessionBeforeOperation } from './authDebugService';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type Invitation = Database['public']['Tables']['invitations']['Row'];

export const createEmailInvitation = async (
  projectId: string,
  role: UserRole,
  email: string
): Promise<{ invitation: Invitation; invitationUrl: string }> => {
  console.log('📧 [EMAIL INVITATION SERVICE] Starting email invitation creation process');
  console.log('📧 [EMAIL INVITATION SERVICE] Input parameters:', { projectId, role, email });
  
  // Phase 1: Session validation
  console.log('🔍 [EMAIL INVITATION SERVICE] Validating session...');
  const { valid: sessionValid, session } = await validateSessionBeforeOperation();
  
  if (!sessionValid || !session?.user) {
    throw new Error('Authentication failed - please log in again');
  }

  console.log('✅ [EMAIL INVITATION SERVICE] Session validation passed:', {
    userId: session.user.id,
    userEmail: session.user.email,
  });

  try {
    // Step 1: Generate invitation token
    console.log('🎲 [EMAIL INVITATION SERVICE] Generating invitation token...');
    const { data: invitationToken, error: tokenError } = await supabase
      .rpc('generate_invitation_token');

    if (tokenError || !invitationToken) {
      console.error('❌ [EMAIL INVITATION SERVICE] Token generation failed:', tokenError);
      throw new Error('Failed to generate invitation token');
    }

    console.log('✅ [EMAIL INVITATION SERVICE] Token generated successfully');

    // Step 2: Create the invitation record
    console.log('📝 [EMAIL INVITATION SERVICE] Creating invitation record...');
    
    const invitationData = {
      email,
      role,
      project_id: projectId,
      invited_by: session.user.id,
      invitation_token: invitationToken,
      token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (invitationError || !invitation) {
      console.error('❌ [EMAIL INVITATION SERVICE] Invitation creation failed:', invitationError);
      throw new Error('Failed to create invitation');
    }

    console.log('✅ [EMAIL INVITATION SERVICE] Invitation created:', invitation.id);

    // Step 3: Get additional context for email
    console.log('📋 [EMAIL INVITATION SERVICE] Fetching context data...');
    
    const [projectResult, inviterResult] = await Promise.all([
      supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single(),
      supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', session.user.id)
        .single()
    ]);

    const projectName = projectResult.data?.name;
    const inviterName = inviterResult.data 
      ? `${inviterResult.data.first_name} ${inviterResult.data.last_name}`.trim()
      : undefined;

    console.log('📋 [EMAIL INVITATION SERVICE] Context data:', { projectName, inviterName });

    // Step 4: Send invitation email
    console.log('📧 [EMAIL INVITATION SERVICE] Sending invitation email...');
    
    const { data: emailResult, error: emailError } = await supabase.functions.invoke(
      'send-invitation-email',
      {
        body: {
          invitationId: invitation.id,
          email,
          role,
          projectName,
          inviterName,
        },
      }
    );

    if (emailError) {
      console.error('❌ [EMAIL INVITATION SERVICE] Email sending failed:', emailError);
      throw new Error('Failed to send invitation email: ' + emailError.message);
    }

    console.log('✅ [EMAIL INVITATION SERVICE] Email sent successfully:', emailResult);

    const invitationUrl = emailResult.invitationUrl || `${window.location.origin}/invite/join/${invitationToken}`;

    return { invitation, invitationUrl };

  } catch (error) {
    console.error('❌ [EMAIL INVITATION SERVICE] Complete process failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      authState: await debugAuthState()
    });
    throw error instanceof Error ? error : new Error('Failed to create email invitation');
  }
};
