
import { supabase } from '@/integrations/supabase/client';
import { UnifiedInvitationService } from './unifiedInvitationService';
import { validateAndProcessInvitationToken } from './invitationTokenService';

export class PostAuthInvitationService {
  /**
   * Process pending invitation after user authentication
   */
  static async processPendingInvitation(): Promise<{
    success: boolean;
    redirectPath?: string;
    message?: string;
    error?: string;
  }> {
    console.log('🔄 [POST-AUTH INVITATION] Checking for pending invitations...');
    
    try {
      // Check for invitation token in session storage
      const invitationToken = sessionStorage.getItem('pending_invitation_token');
      
      if (!invitationToken) {
        console.log('ℹ️ [POST-AUTH INVITATION] No pending invitation token found');
        return { success: true, redirectPath: '/dashboard' };
      }

      console.log('🎯 [POST-AUTH INVITATION] Found pending invitation token, processing...');
      
      // Validate the invitation token
      const tokenValidation = await validateAndProcessInvitationToken(invitationToken);
      
      if (!tokenValidation.invitation) {
        console.error('❌ [POST-AUTH INVITATION] Invalid token:', tokenValidation.error);
        sessionStorage.removeItem('pending_invitation_token');
        return { 
          success: false, 
          error: tokenValidation.error || 'Invalid invitation token',
          redirectPath: '/dashboard'
        };
      }

      const invitation = tokenValidation.invitation;
      console.log('✅ [POST-AUTH INVITATION] Valid invitation found:', invitation);

      // Accept the invitation by ID
      const acceptResult = await UnifiedInvitationService.acceptInvitationById(invitation.id);
      
      if (!acceptResult.success) {
        console.error('❌ [POST-AUTH INVITATION] Failed to accept invitation:', acceptResult.error);
        sessionStorage.removeItem('pending_invitation_token');
        return {
          success: false,
          error: acceptResult.error || 'Failed to accept invitation',
          redirectPath: '/dashboard'
        };
      }

      console.log('🎉 [POST-AUTH INVITATION] Invitation accepted successfully');
      
      // Clear the stored token
      sessionStorage.removeItem('pending_invitation_token');
      
      // Determine redirect path based on invitation type and role
      const redirectPath = this.determineRedirectPath(invitation, acceptResult);
      
      return {
        success: true,
        redirectPath,
        message: acceptResult.message || 'Invitation accepted successfully!'
      };

    } catch (error) {
      console.error('❌ [POST-AUTH INVITATION] Error processing pending invitation:', error);
      sessionStorage.removeItem('pending_invitation_token');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        redirectPath: '/dashboard'
      };
    }
  }

  /**
   * Determine the best redirect path after invitation acceptance
   */
  private static determineRedirectPath(invitation: any, acceptResult: any): string {
    // If it's a duplicate membership, go to general dashboard
    if (acceptResult.duplicate_membership) {
      return '/dashboard';
    }

    // Redirect based on the specific entity and role
    if (invitation.project_id) {
      return `/project/${invitation.project_id}`;
    }
    
    if (invitation.brokerage_id) {
      return `/brokerage/${invitation.brokerage_id}`;
    }
    
    if (invitation.simulation_id) {
      return `/simulation/${invitation.simulation_id}`;
    }

    // Default fallback - redirect to role-appropriate dashboard
    switch (invitation.role) {
      case 'real_estate_agent':
        return '/agent';
      case 'broker_assistant':
        return '/broker-assistant';
      case 'simulation_collaborator':
        return '/dashboard'; // Will show simulation collaborator dashboard
      case 'mortgage_applicant':
        return '/dashboard'; // Will show mortgage applicant dashboard
      case 'brokerage_owner':
        return '/brokerage';
      default:
        return '/dashboard';
    }
  }

  /**
   * Check if there's a pending invitation to process
   */
  static hasPendingInvitation(): boolean {
    return Boolean(sessionStorage.getItem('pending_invitation_token'));
  }

  /**
   * Clear any pending invitation (for cleanup)
   */
  static clearPendingInvitation(): void {
    sessionStorage.removeItem('pending_invitation_token');
  }
}
