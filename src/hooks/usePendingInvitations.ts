
import { useState, useEffect } from 'react';
import { UnifiedInvitationService, type PendingInvitation } from '@/services/unifiedInvitationService';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { supabase } from '@/integrations/supabase/client';

export const usePendingInvitations = () => {
  const { user, refreshUser } = useAuth();
  const { refreshRoles } = useRoleSelection();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvitations = async () => {
    if (!user) {
      console.log('🔍 [PENDING INVITATIONS] No user found, skipping invitation load');
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 [PENDING INVITATIONS] Loading invitations for user:', {
        userId: user.id,
        userEmail: user.email,
        userRoles: user.roles
      });
      
      const pendingInvitations = await UnifiedInvitationService.getMyPendingInvitations();
      
      console.log('✅ [PENDING INVITATIONS] Successfully loaded invitations:', {
        count: pendingInvitations.length,
        invitations: pendingInvitations
      });
      
      setInvitations(pendingInvitations);
      
    } catch (err) {
      console.error('❌ [PENDING INVITATIONS] Error loading invitations:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load invitations';
      if (err instanceof Error) {
        if (err.message.includes('User not found')) {
          errorMessage = 'User profile not found. Please try logging out and back in.';
        } else if (err.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      console.error('❌ [PENDING INVITATIONS] Final error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (
    invitationId: string, 
    projectName?: string | null, 
    projectId?: string | null, 
    brokerageId?: string | null,
    simulationId?: string | null
  ) => {
    try {
      console.log('🎯 [PENDING INVITATIONS] Accepting invitation:', invitationId);
      
      // Optimistically remove invitation from UI for immediate feedback
      const originalInvitations = [...invitations];
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      const result = await UnifiedInvitationService.acceptInvitationById(invitationId);
      
      if (result.success) {
        console.log('✅ [PENDING INVITATIONS] Invitation accepted successfully:', result);
        
        // Immediately refresh auth state and roles to update user context
        console.log('🔄 [PENDING INVITATIONS] Refreshing user auth state and roles...');
        await Promise.all([
          refreshUser(), // Refresh user data including new roles/memberships
          refreshRoles() // Refresh role context to show new memberships
        ]);
        
        // Refresh invitations list to ensure consistency
        await loadInvitations();
        return result;
      } else {
        // Rollback optimistic update on failure
        setInvitations(originalInvitations);
        throw new Error(result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('❌ [PENDING INVITATIONS] Error accepting invitation:', error);
      // Rollback optimistic update on error
      await loadInvitations();
      throw error;
    }
  };

  // Force refresh function that clears cache
  const forceRefresh = async () => {
    console.log('🔄 [PENDING INVITATIONS] Force refreshing invitations...');
    setError(null);
    setLoading(true);
    
    // Small delay to ensure any pending operations complete
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadInvitations();
  };

  useEffect(() => {
    console.log('🚀 [PENDING INVITATIONS] Hook effect triggered, user changed:', {
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id
    });
    loadInvitations();
  }, [user]);

  const rejectInvitation = async (invitationId: string) => {
    try {
      console.log('🗑️ [PENDING INVITATIONS] Rejecting invitation:', invitationId);
      
      // Delete the invitation
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('✅ [PENDING INVITATIONS] Invitation rejected successfully');
      // Refresh invitations list after successful rejection
      await loadInvitations();
    } catch (error) {
      console.error('❌ [PENDING INVITATIONS] Error rejecting invitation:', error);
      throw error;
    }
  };

  return {
    invitations,
    loading,
    error,
    loadInvitations,
    acceptInvitation,
    rejectInvitation,
    forceRefresh,
    invitationCount: invitations.length
  };
};
