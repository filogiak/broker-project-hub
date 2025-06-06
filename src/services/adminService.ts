
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

export interface BrokerageOwnerInfo extends Profile {
  owns_brokerage: boolean;
  brokerage_name: string | null;
}

export interface BrokerageInfo extends Brokerage {
  owner_email: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
}

export interface AvailableOwner {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface CreateBrokerageOwnerData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface CreateBrokerageData {
  name: string;
  description?: string;
  ownerId: string;
}

export const createBrokerageOwner = async (data: CreateBrokerageOwnerData) => {
  console.log('Creating brokerage owner:', data.email);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  // Verify superadmin role before proceeding
  const { data: isSuperadmin, error: roleError } = await supabase.rpc('is_superadmin');
  
  if (roleError) {
    console.error('Error checking superadmin role:', roleError);
    throw new Error('Failed to verify permissions');
  }

  if (!isSuperadmin) {
    throw new Error('Insufficient permissions: superadmin role required');
  }

  const response = await supabase.functions.invoke('create-brokerage-owner', {
    body: data,
  });

  if (response.error) {
    console.error('Create brokerage owner error:', response.error);
    throw new Error(response.error.message || 'Failed to create brokerage owner');
  }

  if (response.data && typeof response.data === 'object' && 'error' in response.data) {
    console.error('Create brokerage owner API error:', response.data.error);
    throw new Error(response.data.error as string);
  }

  console.log('Brokerage owner created successfully:', response.data);
  return response.data;
};

export const getAllBrokerageOwners = async (): Promise<BrokerageOwnerInfo[]> => {
  console.log('Getting all brokerage owners using secure function');
  
  try {
    // First verify superadmin role
    const { data: isSuperadmin, error: roleError } = await supabase.rpc('is_superadmin');
    
    if (roleError) {
      console.error('Error checking superadmin role:', roleError);
      throw new Error('Failed to verify permissions');
    }

    if (!isSuperadmin) {
      throw new Error('Insufficient permissions: superadmin role required');
    }

    const { data, error } = await supabase.rpc('get_all_brokerage_owners');

    if (error) {
      console.error('Get all brokerage owners error:', error);
      throw error;
    }

    console.log('Brokerage owners retrieved successfully:', data);
    return data || [];
  } catch (error) {
    console.error('getAllBrokerageOwners failed:', error);
    throw error;
  }
};

export const getAvailableBrokerageOwners = async (): Promise<AvailableOwner[]> => {
  console.log('Getting available brokerage owners using secure function');
  
  try {
    // First verify superadmin role
    const { data: isSuperadmin, error: roleError } = await supabase.rpc('is_superadmin');
    
    if (roleError) {
      console.error('Error checking superadmin role:', roleError);
      throw new Error('Failed to verify permissions');
    }

    if (!isSuperadmin) {
      throw new Error('Insufficient permissions: superadmin role required');
    }

    const { data, error } = await supabase.rpc('get_available_brokerage_owners');

    if (error) {
      console.error('Get available brokerage owners error:', error);
      throw error;
    }

    console.log('Available brokerage owners retrieved successfully:', data);
    return data || [];
  } catch (error) {
    console.error('getAvailableBrokerageOwners failed:', error);
    throw error;
  }
};

export const createBrokerageForOwner = async (data: CreateBrokerageData) => {
  console.log('Creating brokerage for owner:', data);
  
  // First verify superadmin role
  const { data: isSuperadmin, error: roleError } = await supabase.rpc('is_superadmin');
  
  if (roleError) {
    console.error('Error checking superadmin role:', roleError);
    throw new Error('Failed to verify permissions');
  }

  if (!isSuperadmin) {
    throw new Error('Insufficient permissions: superadmin role required');
  }

  const { data: brokerage, error: brokerageError } = await supabase
    .from('brokerages')
    .insert([{
      name: data.name,
      description: data.description,
      owner_id: data.ownerId,
    }])
    .select()
    .single();

  if (brokerageError) {
    console.error('Create brokerage error:', brokerageError);
    throw brokerageError;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ brokerage_id: brokerage.id })
    .eq('id', data.ownerId);

  if (updateError) {
    console.error('Update profile brokerage_id error:', updateError);
    throw updateError;
  }

  console.log('Brokerage created successfully:', brokerage);
  return brokerage;
};

export const getAllBrokerages = async (): Promise<BrokerageInfo[]> => {
  console.log('Getting all brokerages');
  
  // First verify superadmin role
  const { data: isSuperadmin, error: roleError } = await supabase.rpc('is_superadmin');
  
  if (roleError) {
    console.error('Error checking superadmin role:', roleError);
    throw new Error('Failed to verify permissions');
  }

  if (!isSuperadmin) {
    throw new Error('Insufficient permissions: superadmin role required');
  }

  const { data, error } = await supabase
    .from('brokerages')
    .select(`
      *,
      profiles!brokerages_owner_id_fkey(
        email,
        first_name,
        last_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get brokerages error:', error);
    throw error;
  }

  const brokerages = data?.map((brokerage: any) => ({
    ...brokerage,
    owner_email: brokerage.profiles?.email || 'N/A',
    owner_first_name: brokerage.profiles?.first_name || '',
    owner_last_name: brokerage.profiles?.last_name || '',
  })) || [];

  console.log('Brokerages retrieved:', brokerages);
  return brokerages;
};

export const getTotalUsersCount = async (): Promise<number> => {
  console.log('Getting total users count');
  
  try {
    // First verify superadmin role
    const { data: isSuperadmin, error: roleError } = await supabase.rpc('is_superadmin');
    
    if (roleError) {
      console.error('Error checking superadmin role:', roleError);
      return 0;
    }

    if (!isSuperadmin) {
      console.warn('Non-superadmin user attempting to get total users count');
      return 0;
    }

    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Get total users count error:', error);
      throw error;
    }

    console.log('Total users count:', count);
    return count || 0;
  } catch (error) {
    console.error('getTotalUsersCount failed:', error);
    return 0;
  }
};

export const getTotalBrokeragesCount = async (): Promise<number> => {
  console.log('Getting total brokerages count');
  
  try {
    // First verify superadmin role
    const { data: isSuperadmin, error: roleError } = await supabase.rpc('is_superadmin');
    
    if (roleError) {
      console.error('Error checking superadmin role:', roleError);
      return 0;
    }

    if (!isSuperadmin) {
      console.warn('Non-superadmin user attempting to get total brokerages count');
      return 0;
    }

    const { count, error } = await supabase
      .from('brokerages')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Get total brokerages count error:', error);
      throw error;
    }

    console.log('Total brokerages count:', count);
    return count || 0;
  } catch (error) {
    console.error('getTotalBrokeragesCount failed:', error);
    return 0;
  }
};

export const getTotalProjectsCount = async (): Promise<number> => {
  console.log('Getting total projects count');
  
  try {
    // First verify superadmin role
    const { data: isSuperadmin, error: roleError } = await supabase.rpc('is_superadmin');
    
    if (roleError) {
      console.error('Error checking superadmin role:', roleError);
      return 0;
    }

    if (!isSuperadmin) {
      console.warn('Non-superadmin user attempting to get total projects count');
      return 0;
    }

    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Get total projects count error:', error);
      throw error;
    }

    console.log('Total projects count:', count);
    return count || 0;
  } catch (error) {
    console.error('getTotalProjectsCount failed:', error);
    return 0;
  }
};
