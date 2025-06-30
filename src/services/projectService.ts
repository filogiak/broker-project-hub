import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { populateApplicantNamesInChecklist } from './applicantNameService';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectType = Database['public']['Enums']['project_type'];
type ApplicantCount = Database['public']['Enums']['applicant_count'];

interface ProjectCreationData {
  name: string;
  description: string;
  projectType: ProjectType | null;
  applicantCount: ApplicantCount;
  hasGuarantor: boolean;
  applicantOneFirstName?: string;
  applicantOneLastName?: string;
  applicantTwoFirstName?: string;
  applicantTwoLastName?: string;
}

export const createProject = async (projectData: {
  name: string;
  description?: string;
  brokerageId: string;
  projectType?: ProjectType | null;
  applicantCount?: ApplicantCount;
  hasGuarantor?: boolean;
  applicantOneFirstName?: string;
  applicantOneLastName?: string;
  applicantTwoFirstName?: string;
  applicantTwoLastName?: string;
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
    // Use the updated safe database function with applicant names
    console.log('🛡️ Creating project using safe database function...');
    
    const { data: projectId, error: functionError } = await supabase
      .rpc('safe_create_project', {
        p_name: projectData.name,
        p_brokerage_id: projectData.brokerageId,
        p_description: projectData.description || null,
        p_project_type: projectData.projectType || null,
        p_applicant_count: projectData.applicantCount || 'one_applicant',
        p_has_guarantor: projectData.hasGuarantor || false,
        p_applicant_one_first_name: projectData.applicantOneFirstName || null,
        p_applicant_one_last_name: projectData.applicantOneLastName || null,
        p_applicant_two_first_name: projectData.applicantTwoFirstName || null,
        p_applicant_two_last_name: projectData.applicantTwoLastName || null
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

    // Auto-populate applicant names in checklist items after project creation
    if (projectData.applicantOneFirstName || projectData.applicantOneLastName || 
        projectData.applicantTwoFirstName || projectData.applicantTwoLastName) {
      console.log('🔧 Auto-populating applicant names in checklist...');
      
      // Add a small delay to ensure checklist items are created by the trigger
      setTimeout(async () => {
        try {
          await populateApplicantNamesInChecklist(projectId);
        } catch (populateError) {
          console.error('⚠️ Failed to auto-populate applicant names (non-critical):', populateError);
        }
      }, 1000);
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

export const getUserProjectStats = async (userId: string): Promise<{
  invitedUsers: number;
}> => {
  console.log('📊 Getting user project stats for user:', userId);
  
  try {
    // Check authentication first
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.log('⚠️ No authenticated user, returning 0 stats');
      return { invitedUsers: 0 };
    }

    // Get user's project IDs first
    const { data: userProjects, error: projectsError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);

    if (projectsError || !userProjects?.length) {
      console.log('⚠️ No user projects found - returning 0 stats');
      return { invitedUsers: 0 };
    }

    const projectIds = userProjects.map(p => p.project_id);

    // Count unique invited users across user's projects
    const { data, error } = await supabase
      .from('project_members')
      .select('user_id')
      .in('project_id', projectIds);

    if (error) {
      console.error('❌ Error loading project stats:', error);
      return { invitedUsers: 0 };
    }

    // Count unique user IDs
    const uniqueUserIds = new Set(data?.map(member => member.user_id) || []);
    const invitedUsers = uniqueUserIds.size;

    console.log('✅ User project stats retrieved:', { invitedUsers });
    return { invitedUsers };
  } catch (error) {
    console.error('❌ Error in getUserProjectStats:', error);
    return { invitedUsers: 0 };
  }
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
