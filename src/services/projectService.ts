
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
    // Get all projects for the brokerage that the user has access to
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
