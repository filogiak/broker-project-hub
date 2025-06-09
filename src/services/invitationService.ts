
import { supabase } from '@/integrations/supabase/client';
import { createEmailInvitation } from './emailInvitationService';
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

export const validateInvitationCode = async (code: string): Promise<Invitation | null> => {
  console.log('🔍 [INVITATION SERVICE] Starting invitation code validation:', code);
  
  if (!code || code.length !== 6) {
    console.warn('⚠️ [INVITATION SERVICE] Invalid code format provided:', code);
    return null;
  }

  try {
    console.log('📞 [INVITATION SERVICE] Querying invitations table for code validation...');
    
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitation_code', code)
      .maybeSingle();

    if (error) {
      console.error('❌ [INVITATION SERVICE] Database error during validation:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    if (!invitation) {
      console.warn('⚠️ [INVITATION SERVICE] No invitation found for code:', code);
      return null;
    }

    console.log('📋 [INVITATION SERVICE] Raw invitation found:', {
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
      console.warn('⚠️ [INVITATION SERVICE] Invitation has expired:', {
        code,
        expires_at: invitation.expires_at,
        current_time: now.toISOString()
      });
      return null;
    }

    // Check if invitation has already been accepted
    if (invitation.accepted_at) {
      console.warn('⚠️ [INVITATION SERVICE] Invitation has already been accepted:', {
        code,
        accepted_at: invitation.accepted_at
      });
      return null;
    }

    console.log('✅ [INVITATION SERVICE] Valid invitation found:', {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      project_id: invitation.project_id
    });
    
    return invitation;

  } catch (error) {
    console.error('❌ [INVITATION SERVICE] Invitation validation failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      code
    });
    return null;
  }
};

export const validateInvitationToken = async (encryptedToken: string): Promise<Invitation | null> => {
  console.log('🔍 [INVITATION SERVICE] Starting invitation token validation:', encryptedToken.substring(0, 10) + '...');
  
  if (!encryptedToken) {
    console.warn('⚠️ [INVITATION SERVICE] No token provided');
    return null;
  }

  try {
    console.log('📞 [INVITATION SERVICE] Querying invitations table for token validation...');
    
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('encrypted_token', encryptedToken)
      .maybeSingle();

    if (error) {
      console.error('❌ [INVITATION SERVICE] Database error during token validation:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    if (!invitation) {
      console.warn('⚠️ [INVITATION SERVICE] No invitation found for token');
      return null;
    }

    console.log('📋 [INVITATION SERVICE] Invitation found via token:', {
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
      console.warn('⚠️ [INVITATION SERVICE] Invitation has expired:', {
        expires_at: invitation.expires_at,
        current_time: now.toISOString()
      });
      return null;
    }

    // Check if invitation has already been accepted
    if (invitation.accepted_at) {
      console.warn('⚠️ [INVITATION SERVICE] Invitation has already been accepted:', {
        accepted_at: invitation.accepted_at
      });
      return null;
    }

    console.log('✅ [INVITATION SERVICE] Valid invitation found via token:', {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      project_id: invitation.project_id
    });
    
    return invitation;

  } catch (error) {
    console.error('❌ [INVITATION SERVICE] Token validation failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};

export const acceptInvitation = async (
  invitationId: string,
  userId: string
): Promise<void> => {
  console.log('🤝 [INVITATION SERVICE] Starting invitation acceptance:', { invitationId, userId });
  
  try {
    // Get the invitation details first
    console.log('📋 [INVITATION SERVICE] Fetching invitation details...');
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      console.error('❌ [INVITATION SERVICE] Error fetching invitation:', fetchError);
      throw new Error('Invitation not found');
    }

    console.log('📋 [INVITATION SERVICE] Invitation details retrieved:', {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      project_id: invitation.project_id,
      invited_by: invitation.invited_by
    });

    // Verify invitation hasn't already been accepted
    if (invitation.accepted_at) {
      console.log('⚠️ [INVITATION SERVICE] Invitation already accepted, skipping...');
      return; // Don't throw error, just return as it's already done
    }

    // Step 1: Ensure user has the correct role assigned
    console.log('👤 [INVITATION SERVICE] Ensuring user role is assigned...');
    
    // Check if role already exists
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', invitation.role)
      .maybeSingle();

    if (roleCheckError) {
      console.error('❌ [INVITATION SERVICE] Error checking user role:', roleCheckError);
      throw new Error('Failed to check user role: ' + roleCheckError.message);
    }

    if (!existingRole) {
      console.log('📝 [INVITATION SERVICE] Creating user role assignment...');
      const { error: roleCreateError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: invitation.role
        });

      if (roleCreateError) {
        console.error('❌ [INVITATION SERVICE] Error creating user role:', roleCreateError);
        
        // Check if it's a duplicate role error (unique constraint violation)
        if (roleCreateError.code === '23505') {
          console.warn('⚠️ [INVITATION SERVICE] User role already exists, continuing...');
        } else {
          throw new Error('Failed to assign role: ' + roleCreateError.message);
        }
      } else {
        console.log('✅ [INVITATION SERVICE] User role assigned successfully:', {
          user_id: userId,
          role: invitation.role
        });
      }
    } else {
      console.log('✅ [INVITATION SERVICE] User role already exists');
    }

    // Step 2: Add user to project members
    if (invitation.project_id) {
      console.log('👥 [INVITATION SERVICE] Adding user to project members...');
      
      // Check if already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', invitation.project_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (memberCheckError) {
        console.error('❌ [INVITATION SERVICE] Error checking project membership:', memberCheckError);
        throw new Error('Failed to check project membership: ' + memberCheckError.message);
      }

      if (!existingMember) {
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
          console.error('❌ [INVITATION SERVICE] Error adding project member:', memberError);
          
          // Check if it's a duplicate user error (unique constraint violation)
          if (memberError.code === '23505' && memberError.message.includes('unique_project_user')) {
            console.warn('⚠️ [INVITATION SERVICE] User already a member of project, continuing...');
          } else {
            throw new Error('Failed to add to project: ' + memberError.message);
          }
        } else {
          console.log('✅ [INVITATION SERVICE] User successfully added to project:', {
            project_id: invitation.project_id,
            user_id: userId,
            role: invitation.role
          });
        }
      } else {
        console.log('✅ [INVITATION SERVICE] User already a project member');
      }
    }

    // Step 3: Mark invitation as accepted
    console.log('✅ [INVITATION SERVICE] Marking invitation as accepted...');
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (updateError) {
      console.error('❌ [INVITATION SERVICE] Error accepting invitation:', updateError);
      throw new Error('Failed to accept invitation: ' + updateError.message);
    }

    console.log('🎉 [INVITATION SERVICE] Invitation acceptance completed successfully');

  } catch (error) {
    console.error('❌ [INVITATION SERVICE] Failed to accept invitation:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      invitationId,
      userId
    });
    throw error instanceof Error ? error : new Error('Failed to accept invitation');
  }
};
