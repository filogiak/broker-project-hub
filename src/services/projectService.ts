
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

export const createProject = async (projectData: {
  name: string;
  description?: string;
  brokerageId: string;
}): Promise<Project> => {
  console.log('🚀 Starting project creation with data:', projectData);
  
  // Check authentication first
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ Session error during project creation:', sessionError);
    throw new Error('Authentication session error. Please refresh the page and try again.');
  }

  if (!session?.user) {
    console.error('❌ No authenticated user found during project creation');
    throw new Error('You must be logged in to create projects. Please refresh the page and try again.');
  }

  console.log('✅ User authenticated:', session.user.id);

  try {
    // Use the new safe database function
    console.log('🛡️ Creating project using safe database function...');
    
    const { data: projectId, error: functionError } = await supabase
      .rpc('safe_create_project', {
        p_name: projectData.name,
        p_brokerage_id: projectData.brokerageId,
        p_description: projectData.description || null
      });

    if (functionError) {
      console.error('❌ Safe function failed:', functionError);
      
      // Provide specific error messages based on the error
      if (functionError.message.includes('Authentication required')) {
        throw new Error('Your session has expired. Please refresh the page and log in again.');
      } else if (functionError.message.includes('Not authorized')) {
        throw new Error('You do not have permission to create projects for this brokerage.');
      } else {
        throw new Error(`Failed to create project: ${functionError.message}`);
      }
    }

    if (!projectId) {
      console.error('❌ No project ID returned from function');
      throw new Error('Project creation failed - no ID returned. Please try again.');
    }

    console.log('✅ Project created successfully with ID:', projectId);
    
    // Fetch the created project with error handling
    const { data: createdProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching created project:', fetchError);
      
      if (fetchError.code === 'PGRST116' || fetchError.message.includes('row-level security')) {
        throw new Error('Project was created but cannot be accessed due to permissions. Please refresh the page.');
      } else {
        throw new Error(`Project created but could not be retrieved: ${fetchError.message}`);
      }
    }

    if (!createdProject) {
      console.error('❌ Created project not found');
      throw new Error('Project was created but could not be retrieved. Please refresh the page.');
    }

    console.log('🎉 Project creation completed successfully:', createdProject);
    return createdProject;

  } catch (error) {
    console.error('❌ Project creation failed:', error);
    
    // Re-throw the error as-is if it's already a user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('An unexpected error occurred while creating the project. Please try again.');
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  console.log('🗑️ Deleting project:', projectId);
  
  // Check authentication first
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('You must be logged in to delete projects.');
  }
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('❌ Delete project error:', error);
    
    if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
      throw new Error('You do not have permission to delete this project.');
    }
    
    throw new Error(`Failed to delete project: ${error.message}`);
  }

  console.log('✅ Project deleted successfully');
};

export const getBrokerageProjectStats = async (brokerageId: string): Promise<{
  invitedUsers: number;
}> => {
  console.log('📊 Getting brokerage project stats for brokerage:', brokerageId);
  
  try {
    // Check authentication first
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.log('⚠️ No authenticated user, returning 0 stats');
      return { invitedUsers: 0 };
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
      console.error('❌ Error loading project stats:', error);
      // Return 0 if RLS blocks access instead of throwing
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        console.log('⚠️ No project stats accessible due to RLS - returning 0');
        return { invitedUsers: 0 };
      }
      console.log('⚠️ Project stats query failed - returning 0');
      return { invitedUsers: 0 };
    }

    // Count unique user IDs
    const uniqueUserIds = new Set(data?.map(member => member.user_id) || []);
    const invitedUsers = uniqueUserIds.size;

    console.log('✅ Project stats retrieved:', { invitedUsers });
    return { invitedUsers };
  } catch (error) {
    console.error('❌ Error in getBrokerageProjectStats:', error);
    return { invitedUsers: 0 };
  }
};
