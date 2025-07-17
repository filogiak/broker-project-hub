import { supabase } from '@/integrations/supabase/client';
import { UnifiedInvitationService } from './unifiedInvitationService';
import type { Database } from '@/integrations/supabase/types';

export interface SimulationInvitationWithStatus {
  id: string;
  email: string;
  role: Database['public']['Enums']['user_role'];
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  email_sent: boolean | null;
  email_sent_at: string | null;
  invited_by: string;
  simulation_id: string;
  status: 'pending' | 'accepted' | 'expired' | 'email_failed';
  timeRemaining?: string;
}

export const getSimulationInvitations = async (simulationId: string): Promise<SimulationInvitationWithStatus[]> => {
  console.log('🔍 [SIMULATION INVITATION SERVICE] Fetching invitations for simulation:', simulationId);
  
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      id,
      email,
      role,
      created_at,
      expires_at,
      accepted_at,
      email_sent,
      email_sent_at,
      invited_by,
      simulation_id
    `)
    .eq('simulation_id', simulationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [SIMULATION INVITATION SERVICE] Error fetching invitations:', error);
    throw error;
  }

  console.log('✅ [SIMULATION INVITATION SERVICE] Successfully fetched invitations:', data?.length || 0);

  // Process invitations to add status and time remaining
  const processedInvitations: SimulationInvitationWithStatus[] = (data || []).map(invitation => {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    const isExpired = now > expiresAt;
    const isAccepted = !!invitation.accepted_at;
    const emailFailed = invitation.email_sent === false;

    let status: SimulationInvitationWithStatus['status'];
    if (isAccepted) {
      status = 'accepted';
    } else if (isExpired) {
      status = 'expired';
    } else if (emailFailed) {
      status = 'email_failed';
    } else {
      status = 'pending';
    }

    // Calculate time remaining for pending invitations
    let timeRemaining: string | undefined;
    if (status === 'pending') {
      timeRemaining = calculateTimeRemaining(invitation.expires_at);
    }

    return {
      ...invitation,
      status,
      timeRemaining
    };
  });

  return processedInvitations;
};

export const resendInvitation = async (invitationId: string): Promise<void> => {
  console.log('📧 [SIMULATION INVITATION SERVICE] Resending invitation:', invitationId);
  
  // Get full invitation details for email
  const { data: invitation, error: fetchError } = await supabase
    .from('invitations')
    .select(`
      id,
      email,
      role,
      simulation_id,
      invited_by,
      profiles!invited_by(first_name, last_name, email)
    `)
    .eq('id', invitationId)
    .single();

  if (fetchError || !invitation) {
    console.error('❌ [SIMULATION INVITATION SERVICE] Error fetching invitation details:', fetchError);
    throw fetchError || new Error('Invitation not found');
  }

  // Get simulation details
  const { data: simulation } = await supabase
    .from('simulations')
    .select('name')
    .eq('id', invitation.simulation_id)
    .single();

  const inviterProfile = Array.isArray(invitation.profiles) ? invitation.profiles[0] : invitation.profiles;
  const inviterName = inviterProfile ? 
    `${inviterProfile.first_name} ${inviterProfile.last_name}`.trim() || inviterProfile.email : 
    'Someone';

  const { error } = await supabase.functions.invoke('send-invitation-email', {
    body: {
      invitationId,
      email: invitation.email,
      role: invitation.role,
      inviterName,
      simulationId: invitation.simulation_id,
      simulationName: simulation?.name
    }
  });

  if (error) {
    console.error('❌ [SIMULATION INVITATION SERVICE] Error resending invitation:', error);
    throw error;
  }

  console.log('✅ [SIMULATION INVITATION SERVICE] Successfully resent invitation');
};

export const cancelInvitation = async (invitationId: string): Promise<void> => {
  console.log('🚫 [SIMULATION INVITATION SERVICE] Cancelling invitation:', invitationId);
  
  const { error } = await supabase
    .from('invitations')
    .update({ expires_at: new Date().toISOString() })
    .eq('id', invitationId);

  if (error) {
    console.error('❌ [SIMULATION INVITATION SERVICE] Error cancelling invitation:', error);
    throw error;
  }

  console.log('✅ [SIMULATION INVITATION SERVICE] Successfully cancelled invitation');
};

export const deleteInvitation = async (invitationId: string): Promise<void> => {
  console.log('🗑️ [SIMULATION INVITATION SERVICE] Deleting invitation:', invitationId);
  
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId);

  if (error) {
    console.error('❌ [SIMULATION INVITATION SERVICE] Error deleting invitation:', error);
    throw error;
  }

  console.log('✅ [SIMULATION INVITATION SERVICE] Successfully deleted invitation');
};

export const createSimulationInvitation = async (
  simulationId: string,
  role: Database['public']['Enums']['user_role'],
  email: string
): Promise<{ success: boolean; error?: string }> => {
  console.log('✉️ [SIMULATION INVITATION SERVICE] Creating simulation invitation:', { simulationId, role, email });
  
  try {
    // Create the invitation
    const { data, error } = await supabase.rpc('create_simulation_invitation', {
      p_simulation_id: simulationId,
      p_email: email,
      p_role: role
    });

    if (error) {
      console.error('❌ [SIMULATION INVITATION SERVICE] Error creating invitation:', error);
      return {
        success: false,
        error: error.message
      };
    }

    const result = data as any;
    if (!result?.success) {
      return {
        success: false,
        error: result?.error || 'Failed to create invitation'
      };
    }

    // Get invitation details for email
    const invitationId = result.invitation_id;
    if (invitationId) {
      // Get simulation and inviter details
      const [simulationResult, currentUserResult] = await Promise.all([
        supabase.from('simulations').select('name').eq('id', simulationId).single(),
        supabase.from('profiles').select('first_name, last_name, email').eq('id', (await supabase.auth.getUser()).data.user?.id || '').single()
      ]);

      const simulationName = simulationResult.data?.name || 'Simulation';
      const currentUser = currentUserResult.data;
      const inviterName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.email : 'Someone';

      // Send email notification
      try {
        await supabase.functions.invoke('send-invitation-email', {
          body: {
            invitationId,
            email,
            role,
            inviterName,
            simulationId,
            simulationName
          }
        });
        console.log('✅ [SIMULATION INVITATION SERVICE] Email sent successfully');
      } catch (emailError) {
        console.error('⚠️ [SIMULATION INVITATION SERVICE] Email sending failed but invitation created:', emailError);
        // Don't fail the entire operation if email fails
      }
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('❌ [SIMULATION INVITATION SERVICE] Failed to create invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Utility functions
const calculateTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const getInvitationStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'accepted':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'expired':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'email_failed':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getInvitationStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'expired':
      return 'Expired';
    case 'email_failed':
      return 'Email Failed';
    default:
      return 'Unknown';
  }
};