
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface PendingInvitation {
  id: string;
  role: UserRole;
  project_id: string | null;
  project_name: string | null;
  inviter_name: string;
  created_at: string;
  expires_at: string;
  days_remaining: number;
}

export interface InvitationStatusResult {
  user_exists: boolean;
  user_id: string | null;
  pending_invitations: PendingInvitation[];
  invitation_count: number;
}

export interface InvitationAcceptanceResult {
  success: boolean;
  error?: string;
  message?: string;
  requires_registration?: boolean;
  invitation_id?: string;
  email?: string;
  role?: UserRole;
  project_id?: string | null;
  duplicate_membership?: boolean;
  is_new_user?: boolean;
}

export class UnifiedInvitationService {
  /**
   * Check invitation status for an email (used on invitation link page)
   */
  static async checkInvitationStatus(email: string): Promise<InvitationStatusResult> {
    console.log('🔍 Checking invitation status for:', email);
    
    try {
      const { data, error } = await supabase.rpc('check_invitation_status', {
        p_email: email
      });

      if (error) {
        console.error('❌ Error checking invitation status:', error);
        throw new Error(`Failed to check invitation status: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from invitation status check');
      }

      // Type assertion with runtime validation
      const result = data as any;
      
      if (typeof result !== 'object' || result === null) {
        throw new Error('Invalid response format from invitation status check');
      }

      console.log('✅ Invitation status checked successfully:', result);
      
      return {
        user_exists: Boolean(result.user_exists),
        user_id: result.user_id || null,
        pending_invitations: Array.isArray(result.pending_invitations) ? result.pending_invitations : [],
        invitation_count: Number(result.invitation_count) || 0
      };

    } catch (error) {
      console.error('❌ Failed to check invitation status:', error);
      throw error;
    }
  }

  /**
   * Process invitation acceptance (unified for new and existing users)
   */
  static async processInvitationAcceptance(
    email: string,
    encryptedToken: string,
    userId?: string
  ): Promise<InvitationAcceptanceResult> {
    console.log('🎯 Processing invitation acceptance:', { email, userId: userId ? 'provided' : 'none' });
    
    try {
      const { data, error } = await supabase.rpc('process_invitation_acceptance', {
        p_email: email,
        p_encrypted_token: encryptedToken,
        p_user_id: userId || null
      });

      if (error) {
        console.error('❌ Error processing invitation acceptance:', error);
        throw new Error(`Failed to process invitation: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from invitation processing');
      }

      // Type assertion with runtime validation
      const result = data as any;
      
      if (typeof result !== 'object' || result === null) {
        throw new Error('Invalid response format from invitation processing');
      }

      console.log('✅ Invitation processed successfully:', result);
      return result as InvitationAcceptanceResult;

    } catch (error) {
      console.error('❌ Failed to process invitation acceptance:', error);
      throw error;
    }
  }

  /**
   * Get pending invitations for current logged-in user
   */
  static async getMyPendingInvitations(): Promise<PendingInvitation[]> {
    console.log('📬 Getting pending invitations for current user');
    
    try {
      const { data, error } = await supabase.rpc('get_my_pending_invitations');

      if (error) {
        console.error('❌ Error getting pending invitations:', error);
        throw new Error(`Failed to get pending invitations: ${error.message}`);
      }

      if (!data) {
        console.log('ℹ️ No pending invitations data returned');
        return [];
      }

      // Type assertion with runtime validation
      const result = data as any;
      
      if (typeof result !== 'object' || result === null) {
        console.log('ℹ️ Invalid response format, returning empty array');
        return [];
      }

      if (result.error) {
        throw new Error(result.error);
      }

      console.log('✅ Pending invitations retrieved:', result.count || 0);
      return Array.isArray(result.invitations) ? result.invitations : [];

    } catch (error) {
      console.error('❌ Failed to get pending invitations:', error);
      throw error;
    }
  }

  /**
   * Accept invitation by ID (for logged-in users from dashboard)
   */
  static async acceptInvitationById(invitationId: string): Promise<InvitationAcceptanceResult> {
    console.log('✅ Accepting invitation by ID:', invitationId);
    
    try {
      const { data, error } = await supabase.rpc('accept_invitation_by_id', {
        p_invitation_id: invitationId
      });

      if (error) {
        console.error('❌ Error accepting invitation by ID:', error);
        throw new Error(`Failed to accept invitation: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from invitation acceptance');
      }

      // Type assertion with runtime validation
      const result = data as any;
      
      if (typeof result !== 'object' || result === null) {
        throw new Error('Invalid response format from invitation acceptance');
      }

      console.log('✅ Invitation accepted successfully by ID:', result);
      return result as InvitationAcceptanceResult;

    } catch (error) {
      console.error('❌ Failed to accept invitation by ID:', error);
      throw error;
    }
  }

  /**
   * Create new invitation (keeps existing functionality)
   */
  static async createInvitation(
    projectId: string,
    role: UserRole,
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('📧 Creating invitation:', { projectId, role, email });
    
    try {
      // Use existing email invitation service
      const { createEmailInvitation } = await import('./emailInvitationService');
      const result = await createEmailInvitation(projectId, role, email);
      
      return {
        success: result.success
      };

    } catch (error) {
      console.error('❌ Failed to create invitation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
