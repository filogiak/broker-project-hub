
import { useState, useEffect } from 'react';
import { UnifiedInvitationService, type PendingInvitation } from '@/services/unifiedInvitationService';
import { useAuth } from '@/hooks/useAuth';

export const usePendingInvitations = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvitations = async () => {
    if (!user) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading pending invitations for user:', user.id);
      
      const pendingInvitations = await UnifiedInvitationService.getMyPendingInvitations();
      
      console.log('✅ Successfully loaded invitations:', pendingInvitations);
      setInvitations(pendingInvitations);
      
    } catch (err) {
      console.error('❌ Error loading pending invitations:', err);
      
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
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      console.log('🎯 Accepting invitation:', invitationId);
      
      const result = await UnifiedInvitationService.acceptInvitationById(invitationId);
      
      if (result.success) {
        console.log('✅ Invitation accepted successfully:', result);
        // Refresh invitations list after successful acceptance
        await loadInvitations();
        return result;
      } else {
        throw new Error(result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('❌ Error accepting invitation:', error);
      throw error;
    }
  };

  // Force refresh function that clears cache
  const forceRefresh = async () => {
    console.log('🔄 Force refreshing invitations...');
    setError(null);
    setLoading(true);
    
    // Small delay to ensure any pending operations complete
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadInvitations();
  };

  useEffect(() => {
    console.log('🚀 usePendingInvitations: User changed, loading invitations');
    loadInvitations();
  }, [user]);

  return {
    invitations,
    loading,
    error,
    loadInvitations,
    acceptInvitation,
    forceRefresh,
    invitationCount: invitations.length
  };
};
