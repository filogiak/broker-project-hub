
import { UnifiedInvitationService } from '@/services/unifiedInvitationService';

export interface SentInvitation {
  id: string;
  email: string;
  role: string;
  project_id: string | null;
  project_name: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  email_sent: boolean;
  status: 'pending' | 'accepted' | 'expired' | 'email_failed';
  days_remaining: number;
}

export interface SentInvitationsResult {
  invitations: SentInvitation[];
  count: number;
}

export const getSentInvitations = async (): Promise<SentInvitationsResult> => {
  console.log('📤 [SENT INVITATIONS SERVICE] Fetching sent invitations via unified service');
  
  try {
    const invitations = await UnifiedInvitationService.getMySentInvitations();
    
    return {
      invitations,
      count: invitations.length
    };

  } catch (error) {
    console.error('❌ [SENT INVITATIONS SERVICE] Failed to get sent invitations:', error);
    throw error;
  }
};
