
// Utility functions for encrypting/decrypting invitation tokens
// This provides secure token handling for email-based invitations

export interface InvitationData {
  invitationId: string;
  email: string;
  role: string;
  projectId: string;
  invitedBy: string;
  expiresAt: string;
}

// Simple base64 encoding/decoding for invitation data
// In production, you might want to use more sophisticated encryption
export const encryptInvitationData = (data: InvitationData): string => {
  try {
    const jsonString = JSON.stringify(data);
    return btoa(jsonString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error('Error encrypting invitation data:', error);
    throw new Error('Failed to encrypt invitation data');
  }
};

export const decryptInvitationData = (token: string): InvitationData | null => {
  try {
    // Restore base64 padding
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    
    const jsonString = atob(padded);
    const data = JSON.parse(jsonString) as InvitationData;
    
    // Validate required fields
    if (!data.invitationId || !data.email || !data.role || !data.projectId) {
      return null;
    }
    
    // Check if invitation has expired
    if (new Date(data.expiresAt) <= new Date()) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error decrypting invitation data:', error);
    return null;
  }
};

export const validateInvitationToken = (token: string): boolean => {
  const data = decryptInvitationData(token);
  return data !== null;
};
