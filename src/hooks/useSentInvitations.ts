
import { useState, useEffect } from 'react';
import { getSentInvitations, type SentInvitation } from '@/services/sentInvitationsService';
import { useAuth } from '@/hooks/useAuth';

export const useSentInvitations = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<SentInvitation[]>([]);
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
      const result = await getSentInvitations();
      setInvitations(result.invitations);
    } catch (err) {
      console.error('Error loading sent invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sent invitations');
    } finally {
      setLoading(false);
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
    invitationCount: invitations.length
  };
};
