
import { supabase } from '@/integrations/supabase/client';
import { createEmailInvitation } from './emailInvitationService';
import { validateAndProcessInvitationToken, checkInvitationProcessingStatus } from './invitationTokenService';
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
  const result = await validateAndProcessInvitationToken(encryptedToken);
  return result.invitation;
};

// Check if an invitation has been processed (used for verification)
export const checkInvitationStatus = async (invitationId: string): Promise<{
  processed: boolean;
  error?: string;
}> => {
  return checkInvitationProcessingStatus(invitationId);
};

// Enhanced debug function to check database state
export const debugInvitationState = async (email: string): Promise<{
  invitationExists: boolean;
  userExists: boolean;
  profileExists: boolean;
  invitation?: Invitation;
  details: any;
}> => {
  console.log('🔍 [INVITATION DEBUG] Checking state for email:', email);
  
  try {
    // Check invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invError) {
      console.error('❌ [INVITATION DEBUG] Error checking invitation:', invError);
    }

    // Check if user exists in auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🔍 [INVITATION DEBUG] Current auth user:', user?.email);

    // Check profile
    let profileExists = false;
    let profileData = null;
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      profileExists = !!profile;
      profileData = profile;
      if (profileError) {
        console.error('❌ [INVITATION DEBUG] Error checking profile:', profileError);
      }
    }

    const result = {
      invitationExists: !!invitation,
      userExists: !!user,
      profileExists,
      invitation: invitation || undefined,
      details: {
        invitation: invitation ? {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          project_id: invitation.project_id,
          accepted_at: invitation.accepted_at,
          expires_at: invitation.expires_at
        } : null,
        currentUser: user ? {
          id: user.id,
          email: user.email
        } : null,
        profile: profileData ? {
          id: profileData.id,
          email: profileData.email,
          created_at: profileData.created_at
        } : null
      }
    };

    console.log('📋 [INVITATION DEBUG] State summary:', result);
    return result;

  } catch (error) {
    console.error('❌ [INVITATION DEBUG] Debug failed:', error);
    return {
      invitationExists: false,
      userExists: false,
      profileExists: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
};

// Enhanced invitation acceptance with comprehensive error handling
export const acceptInvitation = async (
  invitationId: string,
  userId: string
): Promise<void> => {
  console.log('🤝 [INVITATION SERVICE] Enhanced acceptInvitation called');
  console.log('📋 [INVITATION SERVICE] Parameters:', { invitationId, userId });
  
  try {
    // Get invitation details for debugging
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (invError || !invitation) {
      console.error('❌ [INVITATION SERVICE] Failed to fetch invitation:', invError);
      throw new Error(`Invitation not found: ${invError?.message || 'Unknown error'}`);
    }

    console.log('📋 [INVITATION SERVICE] Processing invitation:', {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      project_id: invitation.project_id,
      accepted_at: invitation.accepted_at
    });

    // Check if already processed
    if (invitation.accepted_at) {
      console.log('✅ [INVITATION SERVICE] Invitation already accepted');
      return;
    }

    // Run comprehensive debug check
    const debugResult = await debugInvitationState(invitation.email);
    console.log('🔍 [INVITATION SERVICE] Debug state:', debugResult);

    // Check if the invitation was processed by the trigger
    const { processed, error } = await checkInvitationStatus(invitationId);
    
    if (error) {
      console.error('❌ [INVITATION SERVICE] Error checking invitation status:', error);
      throw new Error(`Failed to verify invitation processing: ${error}`);
    }
    
    if (!processed) {
      console.warn('⚠️ [INVITATION SERVICE] Invitation not processed by trigger - manual processing required');
      
      // Manual processing with better error handling
      try {
        // Add user role
        console.log('🔧 [INVITATION SERVICE] Adding user role:', invitation.role);
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: invitation.role })
          .select()
          .single();

        if (roleError && !roleError.message.includes('duplicate')) {
          console.error('❌ [INVITATION SERVICE] Failed to add user role:', roleError);
          throw new Error(`Failed to assign role: ${roleError.message}`);
        }

        // Add to project members if invitation has a project
        if (invitation.project_id) {
          console.log('🔧 [INVITATION SERVICE] Adding to project members');
          const { error: memberError } = await supabase
            .from('project_members')
            .insert({
              project_id: invitation.project_id,
              user_id: userId,
              role: invitation.role,
              invited_by: invitation.invited_by,
              joined_at: new Date().toISOString()
            })
            .select()
            .single();

          if (memberError && !memberError.message.includes('duplicate')) {
            console.error('❌ [INVITATION SERVICE] Failed to add project member:', memberError);
            throw new Error(`Failed to add to project: ${memberError.message}`);
          }
        }

        // Mark invitation as accepted
        console.log('🔧 [INVITATION SERVICE] Marking invitation as accepted');
        const { error: updateError } = await supabase
          .from('invitations')
          .update({ accepted_at: new Date().toISOString() })
          .eq('id', invitationId);

        if (updateError) {
          console.error('❌ [INVITATION SERVICE] Failed to mark invitation as accepted:', updateError);
          // Don't throw here as the main processing succeeded
        }

        console.log('✅ [INVITATION SERVICE] Manual processing completed successfully');
      } catch (manualError) {
        console.error('❌ [INVITATION SERVICE] Manual processing failed:', manualError);
        throw new Error(`Manual invitation processing failed: ${manualError instanceof Error ? manualError.message : 'Unknown error'}`);
      }
    } else {
      console.log('✅ [INVITATION SERVICE] Invitation was processed successfully by database trigger');
    }
    
  } catch (error) {
    console.error('❌ [INVITATION SERVICE] acceptInvitation failed:', error);
    throw error;
  }
};
