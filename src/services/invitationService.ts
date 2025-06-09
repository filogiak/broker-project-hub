import { supabase } from '@/integrations/supabase/client';
import { debugAuthState, validateSessionBeforeOperation, enforceSingleSession } from './authDebugService';
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
  
  // Phase 1: Enhanced session validation with automatic recovery
  console.log('🔍 [INVITATION SERVICE] Validating session for invitation creation...');
  const { valid: sessionValid, session } = await validateSessionBeforeOperation();
  
  if (!sessionValid || !session?.user) {
    console.error('❌ [INVITATION SERVICE] Session validation failed - attempting recovery...');
    
    // Try to enforce single session and retry once
    await enforceSingleSession();
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { valid: retryValid, session: retrySession } = await validateSessionBeforeOperation();
    
    if (!retryValid || !retrySession?.user) {
      console.error('❌ [INVITATION SERVICE] Session recovery failed');
      throw new Error('Authentication failed - please log in again');
    }
    
    console.log('✅ [INVITATION SERVICE] Session recovered successfully');
  }

  // Get final session for operations
  const { data: { session: finalSession } } = await supabase.auth.getSession();
  if (!finalSession?.user) {
    throw new Error('No valid session after validation');
  }

  console.log('✅ [INVITATION SERVICE] Session validation passed:', {
    userId: finalSession.user.id,
    userEmail: finalSession.user.email,
    tokenPresent: !!finalSession.access_token
  });

  try {
    // Step 1: Generate invitation code with enhanced retry logic
    console.log('🎲 [INVITATION SERVICE] Generating invitation code...');
    let invitationCode: string;
    let codeAttempts = 0;
    const maxCodeAttempts = 5;
    
    while (codeAttempts < maxCodeAttempts) {
      try {
        // Validate session before each attempt
        const currentDebug = await debugAuthState();
        if (!currentDebug.dbContextUserId) {
          console.warn(`⚠️ [INVITATION SERVICE] DB context lost on attempt ${codeAttempts + 1}, refreshing...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const { data: code, error: codeError } = await supabase
          .rpc('generate_invitation_code');

        if (codeError) {
          console.error(`❌ [INVITATION SERVICE] Code generation attempt ${codeAttempts + 1} failed:`, codeError);
          codeAttempts++;
          
          if (codeAttempts >= maxCodeAttempts) {
            throw new Error('Failed to generate invitation code after multiple attempts: ' + codeError.message);
          }
          
          // Progressive delay
          await new Promise(resolve => setTimeout(resolve, 1000 * codeAttempts));
          continue;
        }

        if (!code) {
          console.error(`❌ [INVITATION SERVICE] No code returned on attempt ${codeAttempts + 1}`);
          codeAttempts++;
          continue;
        }

        invitationCode = code;
        console.log('✅ [INVITATION SERVICE] Invitation code generated successfully:', invitationCode);
        break;
        
      } catch (error) {
        console.error(`❌ [INVITATION SERVICE] Code generation attempt ${codeAttempts + 1} error:`, error);
        codeAttempts++;
        
        if (codeAttempts >= maxCodeAttempts) {
          throw error;
        }
        
        // Progressive delay
        await new Promise(resolve => setTimeout(resolve, 1000 * codeAttempts));
      }
    }

    // Step 2: Create the invitation record with enhanced session validation
    console.log('📝 [INVITATION SERVICE] Creating invitation record in database...');
    
    const invitationData = {
      email,
      role,
      project_id: projectId,
      invited_by: finalSession.user.id,
      invitation_code: invitationCode!,
      token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    console.log('📝 [INVITATION SERVICE] Invitation data to insert:', invitationData);

    // Attempt insertion with session validation and retry logic
    let insertAttempts = 0;
    const maxInsertAttempts = 3;
    let invitation: Invitation;
    
    while (insertAttempts < maxInsertAttempts) {
      try {
        // Validate session before each insert attempt
        const preInsertDebug = await debugAuthState();
        console.log(`📝 [INVITATION SERVICE] Pre-insert session check (attempt ${insertAttempts + 1}):`, {
          sessionExists: preInsertDebug.sessionExists,
          userExists: preInsertDebug.userExists,
          dbContext: preInsertDebug.dbContextUserId,
          environment: preInsertDebug.environment
        });
        
        if (!preInsertDebug.dbContextUserId) {
          console.warn(`⚠️ [INVITATION SERVICE] DB context missing on insert attempt ${insertAttempts + 1}`);
          
          // Try to recover session
          const { valid: recoveryValid } = await validateSessionBeforeOperation();
          if (!recoveryValid) {
            throw new Error('Session recovery failed during invitation creation');
          }
        }
        
        const { data: insertedInvitation, error: invitationError } = await supabase
          .from('invitations')
          .insert(invitationData)
          .select()
          .single();

        if (invitationError) {
          console.error(`❌ [INVITATION SERVICE] Insert attempt ${insertAttempts + 1} failed:`, {
            message: invitationError.message,
            details: invitationError.details,
            hint: invitationError.hint,
            code: invitationError.code
          });
          
          // Check if it's an auth/RLS issue
          if (invitationError.message.includes('row-level security') || 
              invitationError.message.includes('permission denied') ||
              invitationError.message.includes('auth') ||
              invitationError.code === 'PGRST301') {
            
            console.log('🔄 [INVITATION SERVICE] RLS/Auth error detected, attempting session recovery...');
            
            // Force session validation and recovery
            await enforceSingleSession();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { valid: recoveryValid } = await validateSessionBeforeOperation();
            if (!recoveryValid) {
              throw new Error('Session recovery failed - please log in again');
            }
            
            insertAttempts++;
            if (insertAttempts < maxInsertAttempts) {
              console.log('🔄 [INVITATION SERVICE] Retrying invitation creation with recovered session...');
              continue;
            }
          }
          
          throw new Error('Failed to create invitation: ' + invitationError.message);
        }

        if (!insertedInvitation) {
          throw new Error('Failed to create invitation: No invitation returned');
        }

        invitation = insertedInvitation;
        console.log('🎉 [INVITATION SERVICE] Invitation created successfully:', invitation);
        break;
        
      } catch (error) {
        console.error(`❌ [INVITATION SERVICE] Insert attempt ${insertAttempts + 1} error:`, error);
        insertAttempts++;
        
        if (insertAttempts >= maxInsertAttempts) {
          throw error;
        }
        
        // Progressive delay
        await new Promise(resolve => setTimeout(resolve, 1000 * insertAttempts));
      }
    }

    return { invitation: invitation!, invitationCode: invitationCode! };

  } catch (error) {
    console.error('❌ [INVITATION SERVICE] Complete invitation creation failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      authState: await debugAuthState()
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
