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

  // First, verify brokerage ownership
  console.log('🔍 Verifying brokerage ownership for:', projectData.brokerageId);
  const { data: brokerageCheck, error: brokerageError } = await supabase
    .from('brokerages')
    .select('id, owner_id, name')
    .eq('id', projectData.brokerageId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (brokerageError) {
    console.error('❌ Brokerage verification error:', brokerageError);
    throw new Error(`Failed to verify brokerage ownership: ${brokerageError.message}`);
  }

  if (!brokerageCheck) {
    console.error('❌ User is not owner of brokerage or brokerage not found');
    throw new Error('You are not authorized to create projects for this brokerage');
  }

  console.log('✅ Brokerage ownership verified:', brokerageCheck);

  // Try using the safe database function first
  console.log('🛡️ Attempting to create project using safe database function...');
  try {
    const { data: functionResult, error: functionError } = await supabase
      .rpc('create_project_safe', {
        project_name: projectData.name,
        project_description: projectData.description || null,
        brokerage_id: projectData.brokerageId
      });

    if (functionError) {
      console.warn('⚠️ Database function failed, falling back to direct insert:', functionError);
      throw functionError; // Will trigger fallback
    }

    if (functionResult) {
      console.log('✅ Project created successfully via database function, ID:', functionResult);
      
      // Fetch the created project
      const { data: createdProject, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', functionResult)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching created project:', fetchError);
        throw fetchError;
      }

      console.log('🎉 Project creation completed successfully:', createdProject);
      return createdProject;
    }
  } catch (functionError) {
    console.warn('⚠️ Safe function approach failed, trying direct insert fallback...');
  }

  // Fallback: Direct insert approach with detailed logging
  console.log('🔄 Using fallback direct insert approach...');
  
  try {
    const insertData = {
      name: projectData.name,
      description: projectData.description,
      brokerage_id: projectData.brokerageId,
      created_by: user.id,
      status: 'active' as const
    };

    console.log('📝 Inserting project with data:', insertData);

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Direct insert failed with error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // Special handling for infinite recursion error
      if (error.message?.includes('infinite recursion')) {
        console.error('🔄 Infinite recursion detected in RLS policy');
        throw new Error('Project creation temporarily unavailable due to database configuration. Please contact support.');
      }

      throw error;
    }

    console.log('🎉 Project created successfully via direct insert:', data);
    return data;

  } catch (directError) {
    console.error('❌ All project creation methods failed:', directError);
    
    const errorMessage = directError instanceof Error ? directError.message : 'Unknown error occurred';
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
