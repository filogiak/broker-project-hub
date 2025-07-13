import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

export const createProject = async (projectData: ProjectInsert): Promise<Project> => {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
};

export const getBrokerageProjects = async (brokerageId: string): Promise<Project[]> => {
  console.log('🔍 Getting projects for brokerage:', brokerageId);
  
  // Check authentication first
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    console.log('❌ No authenticated user found');
    return [];
  }

  try {
    // The RLS policies will now handle filtering based on user roles automatically
    // Broker assistants will see all projects in their brokerage
    // Other roles will only see projects they're members of
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('brokerage_id', brokerageId)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('❌ Error fetching brokerage projects:', projectsError);
      return [];
    }

    console.log('✅ Brokerage projects fetched successfully:', projectsData?.length || 0, 'projects');
    return projectsData || [];

  } catch (error) {
    console.error('❌ Unexpected error in getBrokerageProjects:', error);
    return [];
  }
};

export const getUserProjectStats = async (userId: string) => {
  try {
    console.log('📊 Getting project stats for user:', userId);
    
    // Get projects where user is a member
    const { data: projectsData, error: projectsError } = await supabase
      .from('project_members')
      .select('project_id, projects(*)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (projectsError) {
      console.error('❌ Error fetching user project stats:', projectsError);
      return {
        totalProjects: 0,
        activeProjects: 0,
        recentProjects: []
      };
    }

    const projects = projectsData?.map(pm => pm.projects).filter(Boolean) || [];
    const activeProjects = projects.filter(p => p?.status === 'active');

    console.log('✅ User project stats fetched successfully:', {
      total: projects.length,
      active: activeProjects.length
    });

    return {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      recentProjects: projects.slice(0, 5)
    };

  } catch (error) {
    console.error('❌ Unexpected error in getUserProjectStats:', error);
    return {
      totalProjects: 0,
      activeProjects: 0,
      recentProjects: []
    };
  }
};
