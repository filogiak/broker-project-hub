import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProjectMember = Database['public']['Tables']['project_members']['Row'];

export const validateMemberDeletion = async (projectId: string, memberId: string): Promise<{
  canDelete: boolean;
  reason?: string;
}> => {
  const currentUser = await supabase.auth.getUser();
  
  if (!currentUser.data.user) {
    return { canDelete: false, reason: 'User not authenticated' };
  }

  // Check if trying to delete yourself
  if (currentUser.data.user.id === memberId) {
    return { canDelete: false, reason: 'Cannot delete yourself from the project' };
  }

  // Get current user's roles and permissions
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', currentUser.data.user.id);

  const isSupeadmin = userRoles?.some(ur => ur.role === 'superadmin');
  
  if (isSupeadmin) {
    return { canDelete: true };
  }

  // Check if user owns the project's brokerage
  const { data: project } = await supabase
    .from('projects')
    .select('brokerage_id, brokerages!inner(owner_id)')
    .eq('id', projectId)
    .single();

  const ownsBrokerage = project?.brokerages?.owner_id === currentUser.data.user.id;

  if (ownsBrokerage) {
    // Check if this is the last brokerage owner
    const { data: brokerageOwners } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId)
      .eq('role', 'brokerage_owner');

    if (brokerageOwners && brokerageOwners.length <= 1) {
      const { data: memberToDelete } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', memberId)
        .single();

      if (memberToDelete?.role === 'brokerage_owner') {
        return { canDelete: false, reason: 'Cannot delete the last brokerage owner from the project' };
      }
    }

    return { canDelete: true };
  }

  return { canDelete: false, reason: 'You do not have permission to delete members from this project' };
};

const cleanupRelatedData = async (projectId: string, memberUserId: string) => {
  // Get the member's participant designation
  const { data: member } = await supabase
    .from('project_members')
    .select('participant_designation')
    .eq('project_id', projectId)
    .eq('user_id', memberUserId)
    .single();

  if (!member || !member.participant_designation) {
    return;
  }

  const participantDesignation = member.participant_designation;

  // Clean up checklist items for this participant
  await supabase
    .from('project_checklist_items')
    .delete()
    .eq('project_id', projectId)
    .eq('participant_designation', participantDesignation);

  // Clean up debt items
  await supabase
    .from('project_debt_items')
    .delete()
    .eq('project_id', projectId)
    .eq('participant_designation', participantDesignation);

  // Clean up dependent items
  await supabase
    .from('project_dependent_items')
    .delete()
    .eq('project_id', projectId)
    .eq('participant_designation', participantDesignation);

  // Clean up secondary income items
  await supabase
    .from('project_secondary_income_items')
    .delete()
    .eq('project_id', projectId)
    .eq('participant_designation', participantDesignation);

  // Clean up properties
  await supabase
    .from('project_properties')
    .delete()
    .eq('project_id', projectId)
    .eq('participant_designation', participantDesignation);

  // Note: We keep project_documents but they will show as uploaded by "deleted user"
};

export const deleteMemberFromProject = async (projectId: string, memberId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Validate deletion permissions
    const validation = await validateMemberDeletion(projectId, memberId);
    if (!validation.canDelete) {
      return { success: false, error: validation.reason };
    }

    // Start transaction-like cleanup
    await cleanupRelatedData(projectId, memberId);

    // Delete the project member
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', memberId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting project member:', error);
    return { success: false, error: error.message || 'Failed to delete member' };
  }
};

export const getMemberDataImpact = async (projectId: string, memberId: string): Promise<{
  documentsCount: number;
  checklistItemsCount: number;
  otherDataCount: number;
}> => {
  // Get member's participant designation
  const { data: member } = await supabase
    .from('project_members')
    .select('participant_designation')
    .eq('project_id', projectId)
    .eq('user_id', memberId)
    .single();

  if (!member?.participant_designation) {
    return { documentsCount: 0, checklistItemsCount: 0, otherDataCount: 0 };
  }

  const participantDesignation = member.participant_designation;

  // Count documents uploaded by this user
  const { count: documentsCount } = await supabase
    .from('project_documents')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('uploaded_by', memberId);

  // Count checklist items for this participant
  const { count: checklistItemsCount } = await supabase
    .from('project_checklist_items')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('participant_designation', participantDesignation);

  // Count other data items (debts, dependents, income, properties)
  const { count: debtCount } = await supabase
    .from('project_debt_items')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('participant_designation', participantDesignation);

  const { count: dependentCount } = await supabase
    .from('project_dependent_items')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('participant_designation', participantDesignation);

  const { count: incomeCount } = await supabase
    .from('project_secondary_income_items')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('participant_designation', participantDesignation);

  const { count: propertiesCount } = await supabase
    .from('project_properties')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('participant_designation', participantDesignation);

  const otherDataCount = (debtCount || 0) + (dependentCount || 0) + (incomeCount || 0) + (propertiesCount || 0);

  return {
    documentsCount: documentsCount || 0,
    checklistItemsCount: checklistItemsCount || 0,
    otherDataCount
  };
};
