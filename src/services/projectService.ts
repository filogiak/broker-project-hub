
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
type ProjectMember = Database['public']['Tables']['project_members']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

export interface ProjectData {
  name: string;
  description?: string;
  brokerageId: string;
  status?: string;
}

export interface ClientData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface AgentData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export const createProject = async (projectData: ProjectData): Promise<Project> => {
  console.log('Creating project:', projectData);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create a project');
  }

  // Verify user owns the brokerage
  const { data: brokerage, error: brokerageError } = await supabase
    .from('brokerages')
    .select('id')
    .eq('id', projectData.brokerageId)
    .eq('owner_id', user.id)
    .single();

  if (brokerageError || !brokerage) {
    throw new Error('You can only create projects in your own brokerage');
  }

  const insertData: ProjectInsert = {
    name: projectData.name,
    description: projectData.description,
    brokerage_id: projectData.brokerageId,
    created_by: user.id,
    status: projectData.status || 'active',
  };

  const { data, error } = await supabase
    .from('projects')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Create project error:', error);
    throw error;
  }

  console.log('Project created successfully:', data);
  return data;
};

export const getProject = async (projectId: string): Promise<Project> => {
  console.log('Getting project:', projectId);
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Get project error:', error);
    throw error;
  }

  console.log('Project retrieved:', data);
  return data;
};

export const getProjectsByBrokerageOwner = async (ownerId: string): Promise<Project[]> => {
  console.log('Getting projects by brokerage owner:', ownerId);
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      brokerages!inner(
        id,
        name,
        owner_id
      )
    `)
    .eq('brokerages.owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get projects by brokerage owner error:', error);
    throw error;
  }

  console.log('Projects retrieved:', data);
  return data || [];
};

export const updateProject = async (projectId: string, projectData: Partial<ProjectData>): Promise<Project> => {
  console.log('Updating project:', projectId, projectData);
  
  const updateData: ProjectUpdate = {};
  if (projectData.name !== undefined) updateData.name = projectData.name;
  if (projectData.description !== undefined) updateData.description = projectData.description;
  if (projectData.status !== undefined) updateData.status = projectData.status;

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Update project error:', error);
    throw error;
  }

  console.log('Project updated successfully:', data);
  return data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  console.log('Deleting project:', projectId);
  
  // First delete related project members
  const { error: membersError } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId);

  if (membersError) {
    console.error('Delete project members error:', membersError);
    throw membersError;
  }

  // Delete related invitations
  const { error: invitationsError } = await supabase
    .from('invitations')
    .delete()
    .eq('project_id', projectId);

  if (invitationsError) {
    console.error('Delete project invitations error:', invitationsError);
    throw invitationsError;
  }

  // Finally delete the project
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

export const addClientToProject = async (projectId: string, clientData: ClientData) => {
  console.log('Adding client to project:', projectId, clientData);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  // Verify user can access this project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found or access denied');
  }

  const { data, error } = await supabase
    .from('invitations')
    .insert([{
      email: clientData.email,
      project_id: projectId,
      role: 'mortgage_applicant' as UserRole,
      invited_by: user.id,
    }])
    .select()
    .single();

  if (error) {
    console.error('Add client to project error:', error);
    throw error;
  }

  console.log('Client invitation created:', data);
  return data;
};

export const addAgentToProject = async (projectId: string, agentData: AgentData) => {
  console.log('Adding agent to project:', projectId, agentData);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  // Verify user can access this project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found or access denied');
  }

  const { data, error } = await supabase
    .from('invitations')
    .insert([{
      email: agentData.email,
      project_id: projectId,
      role: 'real_estate_agent' as UserRole,
      invited_by: user.id,
    }])
    .select()
    .single();

  if (error) {
    console.error('Add agent to project error:', error);
    throw error;
  }

  console.log('Agent invitation created:', data);
  return data;
};

export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  console.log('Getting project members:', projectId);
  
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      *,
      profiles:user_id (
        id,
        email,
        first_name,
        last_name,
        phone
      )
    `)
    .eq('project_id', projectId);

  if (error) {
    console.error('Get project members error:', error);
    throw error;
  }

  console.log('Project members retrieved:', data);
  return data || [];
};

export const removeProjectMember = async (projectId: string, userId: string): Promise<void> => {
  console.log('Removing project member:', projectId, userId);
  
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) {
    console.error('Remove project member error:', error);
    throw error;
  }

  console.log('Project member removed successfully');
};

export const getProjectInvitations = async (projectId: string) => {
  console.log('Getting project invitations:', projectId);
  
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('project_id', projectId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get project invitations error:', error);
    throw error;
  }

  console.log('Project invitations retrieved:', data);
  return data || [];
};

export const getBrokerageProjectStats = async (brokerageId: string) => {
  console.log('Getting brokerage project stats:', brokerageId);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  // Get all project IDs for this brokerage (RLS will ensure user can only see their own)
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .eq('brokerage_id', brokerageId);

  if (projectsError) {
    console.error('Error loading projects for stats:', projectsError);
    throw projectsError;
  }

  const projectIds = projects?.map(p => p.id) || [];
  
  if (projectIds.length === 0) {
    return { invitedUsers: 0 };
  }

  // Count invited users across all projects (RLS will ensure proper access)
  const { data: invitations, error: invitationsError } = await supabase
    .from('invitations')
    .select('email')
    .in('project_id', projectIds);

  if (invitationsError) {
    console.error('Error loading invitations for stats:', invitationsError);
    throw invitationsError;
  }

  // Count unique invited users
  const uniqueEmails = new Set(invitations?.map(inv => inv.email) || []);
  
  console.log('Brokerage project stats retrieved:', { invitedUsers: uniqueEmails.size });
  return { invitedUsers: uniqueEmails.size };
};
