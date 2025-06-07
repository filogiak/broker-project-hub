import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

export const createProject = async (projectData: {
  name: string;
  description?: string;
  brokerageId: string;
}): Promise<Project> => {
  console.log('🚀 Starting project creation with data:', projectData);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ No authenticated user found');
    throw new Error('User must be authenticated to create projects');
  }

  console.log('✅ User authenticated:', user.id);

  // Use the safe database function that handles RLS properly
  console.log('🛡️ Creating project using safe database function...');
  
  try {
    const { data: projectId, error: functionError } = await supabase
      .rpc('create_project_safe', {
        project_name: projectData.name,
        brokerage_uuid: projectData.brokerageId,
        project_description: projectData.description || null
      });

    if (functionError) {
      console.error('❌ Safe function failed:', functionError);
      throw functionError;
    }

    if (!projectId) {
      console.error('❌ No project ID returned from function');
      throw new Error('Failed to create project - no ID returned');
    }

    console.log('✅ Project created successfully with ID:', projectId);
    
    // Fetch the created project
    const { data: createdProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching created project:', fetchError);
      throw fetchError;
    }

    if (!createdProject) {
      console.error('❌ Created project not found');
      throw new Error('Project was created but could not be retrieved');
    }

    console.log('🎉 Project creation completed successfully:', createdProject);
    return createdProject;

  } catch (error) {
    console.error('❌ Project creation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Provide user-friendly error messages
    if (errorMessage.includes('not authorized')) {
      throw new Error('You do not have permission to create projects for this brokerage.');
    } else if (errorMessage.includes('must be authenticated')) {
      throw new Error('You must be logged in to create projects.');
    }
    
    throw new Error(`Failed to create project: ${errorMessage}`);
  }
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
  console.log('Getting brokerage project stats for brokerage:', brokerageId);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Count unique invited users across all projects in this brokerage
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
      console.error('Error loading project stats:', error);
      // Return 0 if RLS blocks access instead of throwing
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        console.log('No project stats accessible due to RLS - returning 0');
        return { invitedUsers: 0 };
      }
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
