
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

export const createProject = async (projectData: {
  name: string;
  description?: string;
  brokerageId: string;
}): Promise<Project> => {
  console.log('Creating project:', projectData);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create projects');
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: projectData.name,
      description: projectData.description,
      brokerage_id: projectData.brokerageId,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Create project error:', error);
    throw error;
  }

  console.log('Project created:', data);
  return data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  console.log('Deleting project:', projectId);
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Delete project error:', error);
    throw error;
  }

  console.log('Project deleted successfully');
};

export const getBrokerageProjectStats = async (brokerageId: string): Promise<{
  invitedUsers: number;
}> => {
  console.log('Getting brokerage project stats:', brokerageId);
  
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Count unique invited users across all projects in this brokerage
    // Use project_members table to avoid RLS issues
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        user_id,
        projects!inner (
          brokerage_id
        )
      `)
      .eq('projects.brokerage_id', brokerageId);

    if (error) {
      console.error('Error loading projects for stats:', error);
      return { invitedUsers: 0 };
    }

    // Count unique user IDs
    const uniqueUserIds = new Set(data?.map(member => member.user_id) || []);
    const invitedUsers = uniqueUserIds.size;

    console.log('Project stats retrieved:', { invitedUsers });
    return { invitedUsers };
  } catch (error) {
    console.error('Error in getBrokerageProjectStats:', error);
    return { invitedUsers: 0 };
  }
};
