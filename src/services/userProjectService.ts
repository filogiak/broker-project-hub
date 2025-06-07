
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  console.log('🔍 Getting projects for user:', userId);
  
  // Check authentication first
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    console.log('❌ No authenticated user found');
    return [];
  }

  try {
    // First, get all project IDs where the user is a member
    const { data: membershipData, error: membershipError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);

    if (membershipError) {
      console.error('❌ Error fetching project memberships:', membershipError);
      return [];
    }

    if (!membershipData || membershipData.length === 0) {
      console.log('ℹ️ No project memberships found for user');
      return [];
    }

    const projectIds = membershipData.map(membership => membership.project_id);
    console.log('✅ Found project memberships:', projectIds.length, 'projects');

    // Then fetch the actual projects using the IDs
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('❌ Error fetching projects by IDs:', projectsError);
      return [];
    }

    console.log('✅ Projects fetched successfully:', projectsData?.length || 0, 'projects');
    return projectsData || [];

  } catch (error) {
    console.error('❌ Unexpected error in getUserProjects:', error);
    return [];
  }
};
