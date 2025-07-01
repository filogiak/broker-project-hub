
import { supabase } from '@/integrations/supabase/client';
import { UnifiedInvitationService } from '@/services/unifiedInvitationService';
import type { Database } from '@/integrations/supabase/types';

type Invitation = Database['public']['Tables']['invitations']['Row'];

export interface InvitationWithStatus extends Invitation {
  status: 'pending' | 'accepted' | 'expired' | 'email_failed';
  timeRemaining?: string;
}

export const getProjectInvitations = async (projectId: string): Promise<InvitationWithStatus[]> => {
  console.log('📧 [PROJECT INVITATION SERVICE] Fetching invitations for project:', projectId);
  
  try {
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [PROJECT INVITATION SERVICE] Error fetching invitations:', error);
      throw error;
    }

    const now = new Date();
    
    const invitationsWithStatus: InvitationWithStatus[] = (invitations || []).map(invitation => {
      let status: 'pending' | 'accepted' | 'expired' | 'email_failed';
      let timeRemaining: string | undefined;

      if (invitation.accepted_at) {
        status = 'accepted';
      } else if (invitation.email_sent === false) {
        status = 'email_failed';
      } else if (new Date(invitation.expires_at) <= now) {
        status = 'expired';
      } else {
        status = 'pending';
        timeRemaining = calculateTimeRemaining(invitation.expires_at);
      }

      return {
        ...invitation,
        status,
        timeRemaining
      };
    });

    console.log('✅ [PROJECT INVITATION SERVICE] Invitations fetched:', invitationsWithStatus.length);
    return invitationsWithStatus;

  } catch (error) {
    console.error('❌ [PROJECT INVITATION SERVICE] Failed to fetch invitations:', error);
    throw error;
  }
};

export const resendInvitation = async (invitationId: string): Promise<void> => {
  console.log('🔄 [PROJECT INVITATION SERVICE] Resending invitation:', invitationId);
  
  try {
    // Get invitation details
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      throw new Error('Invitation not found');
    }

    // Call the edge function to resend email
    const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        invitationId: invitation.id,
        email: invitation.email,
        projectName: 'Project', // We could fetch project name if needed
        role: invitation.role,
        inviterName: 'Team',
        encryptedToken: invitation.encrypted_token,
      },
    });

    if (emailError) {
      throw new Error(`Failed to resend email: ${emailError.message}`);
    }

    // Update email_sent status
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ 
        email_sent: true, 
        email_sent_at: new Date().toISOString() 
      })
      .eq('id', invitationId);

    if (updateError) {
      console.warn('⚠️ [PROJECT INVITATION SERVICE] Failed to update email status:', updateError);
    }

    console.log('✅ [PROJECT INVITATION SERVICE] Invitation resent successfully');

  } catch (error) {
    console.error('❌ [PROJECT INVITATION SERVICE] Failed to resend invitation:', error);
    throw error;
  }
};

export const cancelInvitation = async (invitationId: string): Promise<void> => {
  console.log('❌ [PROJECT INVITATION SERVICE] Cancelling invitation:', invitationId);
  
  try {
    // Mark invitation as expired by setting expires_at to now
    const { error } = await supabase
      .from('invitations')
      .update({ expires_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (error) {
      throw error;
    }

    console.log('✅ [PROJECT INVITATION SERVICE] Invitation cancelled successfully');

  } catch (error) {
    console.error('❌ [PROJECT INVITATION SERVICE] Failed to cancel invitation:', error);
    throw error;
  }
};

export const deleteInvitation = async (invitationId: string): Promise<void> => {
  console.log('🗑️ [PROJECT INVITATION SERVICE] Deleting invitation:', invitationId);
  
  try {
    // Actually delete the invitation record
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      throw error;
    }

    console.log('✅ [PROJECT INVITATION SERVICE] Invitation deleted successfully');

  } catch (error) {
    console.error('❌ [PROJECT INVITATION SERVICE] Failed to delete invitation:', error);
    throw error;
  }
};

// Create invitation using the unified service
export const createProjectInvitation = async (
  projectId: string,
  role: 'real_estate_agent' | 'broker_assistant' | 'mortgage_applicant',
  email: string
): Promise<{ success: boolean; error?: string }> => {
  console.log('📧 [PROJECT INVITATION SERVICE] Creating invitation via unified service');
  
  try {
    return await UnifiedInvitationService.createInvitation(projectId, role, email);
  } catch (error) {
    console.error('❌ [PROJECT INVITATION SERVICE] Failed to create invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

const calculateTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Expired';
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} ${days === 1 ? 'giorno' : 'giorni'}, ${hours} ${hours === 1 ? 'ora' : 'ore'}`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'ora' : 'ore'}, ${minutes} ${minutes === 1 ? 'minuto' : 'minuti'}`;
  } else {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minuti'}`;
  }
};

export const getInvitationStatusColor = (status: string): string => {
  switch (status) {
    case 'accepted':
      return 'text-green-600 bg-green-50';
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    case 'expired':
      return 'text-red-600 bg-red-50';
    case 'email_failed':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getInvitationStatusText = (status: string): string => {
  switch (status) {
    case 'accepted':
      return 'Accettato';
    case 'pending':
      return 'In Attesa';
    case 'expired':
      return 'Scaduto';
    case 'email_failed':
      return 'Email Fallita';
    default:
      return 'Sconosciuto';
  }
};
