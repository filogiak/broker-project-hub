import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export const getBrokerageByOwner = async (ownerId: string): Promise<Brokerage | null> => {
  console.log('Getting brokerage by owner:', ownerId);
  
  const { data, error } = await supabase
    .from('brokerages')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) {
    console.error('Get brokerage by owner error:', error);
    throw error;
  }

  console.log('Brokerage retrieved:', data);
  return data;
};

export const getBrokerageProjects = async (brokerageId: string): Promise<Project[]> => {
  console.log('🔍 Getting projects for brokerage:', brokerageId);
  
  // Use the exact same approach as admin dashboard - simple direct query
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('brokerage_id', brokerageId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching projects:', error);
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  console.log('✅ Projects fetched successfully:', data?.length || 0, 'projects');
  return data || [];
};

export const updateBrokerageProfile = async (brokerageId: string, updates: {
  name?: string;
  description?: string;
}): Promise<Brokerage> => {
  console.log('Updating brokerage profile:', brokerageId, updates);
  
  const { data, error } = await supabase
    .from('brokerages')
    .update(updates)
    .eq('id', brokerageId)
    .select()
    .single();

  if (error) {
    console.error('Update brokerage profile error:', error);
    throw error;
  }

  console.log('Brokerage profile updated:', data);
  return data;
};

export const updateOwnerProfile = async (userId: string, updates: {
  first_name?: string;
  last_name?: string;
  phone?: string;
}): Promise<Profile> => {
  console.log('Updating owner profile:', userId, updates);
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Update owner profile error:', error);
    throw error;
  }

  console.log('Owner profile updated:', data);
  return data;
};

export const validateBrokerageOwnership = async (brokerageId: string, ownerId: string): Promise<boolean> => {
  console.log('Validating brokerage ownership:', brokerageId, ownerId);
  
  const { data, error } = await supabase
    .from('brokerages')
    .select('id')
    .eq('id', brokerageId)
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (error) {
    console.error('Validate brokerage ownership error:', error);
    return false;
  }

  return !!data;
};
