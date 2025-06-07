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

  // First, verify brokerage ownership with detailed logging
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

  // Check current RLS policies by trying a simple select first
  console.log('🔍 Testing RLS policies with simple project select...');
  try {
    const { data: testProjects, error: testError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('brokerage_id', projectData.brokerageId)
      .limit(1);
    
    if (testError) {
      console.error('❌ RLS test failed:', testError);
    } else {
      console.log('✅ RLS test passed, found projects:', testProjects?.length || 0);
    }
  } catch (rlsTestError) {
    console.error('❌ RLS test exception:', rlsTestError);
  }

  // Direct insert approach with extensive logging
  console.log('📝 Attempting direct insert approach...');
  
  try {
    const insertData = {
      name: projectData.name,
      description: projectData.description || null,
      brokerage_id: projectData.brokerageId,
      created_by: user.id,
      status: 'active' as const
    };

    console.log('📋 Insert data prepared:', insertData);
    console.log('🎯 About to execute INSERT operation...');

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Direct insert failed with detailed error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        insertData: insertData
      });

      // Check if it's the infinite recursion error
      if (error.message?.includes('infinite recursion')) {
        console.error('🔄 Infinite recursion detected in RLS policy');
        
        // Let's try to understand which policy is causing the issue
        console.log('🔍 Checking user roles and permissions...');
        try {
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          
          console.log('👤 User roles:', userRoles, rolesError);
        } catch (rolesCheckError) {
          console.error('❌ Failed to check user roles:', rolesCheckError);
        }

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
