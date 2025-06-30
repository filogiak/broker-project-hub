
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
      const pendingInvitations = await UnifiedInvitationService.getMyPendingInvitations();
      setInvitations(pendingInvitations);
    } catch (err) {
      console.error('Error loading pending invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      const result = await UnifiedInvitationService.acceptInvitationById(invitationId);
      
      if (result.success) {
        // Refresh invitations list
        await loadInvitations();
        return result;
      } else {
        throw new Error(result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [user]);

  return {
    invitations,
    loading,
    error,
    loadInvitations,
    acceptInvitation,
    invitationCount: invitations.length
  };
};
