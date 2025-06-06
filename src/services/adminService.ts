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

  const response = await supabase.functions.invoke('create-brokerage-owner', {
    body: data,
  });

  if (response.error) {
    console.error('Create brokerage owner error:', response.error);
    throw new Error(response.error.message || 'Failed to create brokerage owner');
  }

  console.log('Brokerage owner created successfully:', response.data);
  return response.data;
};

export const getAllBrokerageOwners = async (): Promise<BrokerageOwnerInfo[]> => {
  console.log('Getting all brokerage owners');
  
  try {
    // Get all profiles that have the brokerage_owner role
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles!inner(role)
      `)
      .eq('user_roles.role', 'brokerage_owner');

    if (profilesError) {
      console.error('Get brokerage owners profiles error:', profilesError);
      throw profilesError;
    }

    console.log('Raw profiles data:', profilesData);

    if (!profilesData || profilesData.length === 0) {
      console.log('No brokerage owners found');
      return [];
    }

    // Get brokerage information for owners who have one
    const profileIds = profilesData.map(p => p.id);
    const { data: brokeragesData, error: brokeragesError } = await supabase
      .from('brokerages')
      .select('id, name, owner_id')
      .in('owner_id', profileIds);

    if (brokeragesError) {
      console.error('Get brokerages error:', brokeragesError);
      // Don't throw here, just log and continue without brokerage info
    }

    console.log('Brokerages data:', brokeragesData);

    // Map profiles to brokerage owner info
    const brokerageOwners = profilesData.map((profile: any) => {
      const brokerage = brokeragesData?.find(b => b.owner_id === profile.id);
      
      return {
        ...profile,
        owns_brokerage: !!brokerage,
        brokerage_name: brokerage?.name || null,
      };
    });

    console.log('Processed brokerage owners:', brokerageOwners);
    return brokerageOwners;
  } catch (error) {
    console.error('getAllBrokerageOwners failed:', error);
    throw error;
  }
};

export const getAvailableBrokerageOwners = async (): Promise<AvailableOwner[]> => {
  console.log('Getting available brokerage owners');
  
  try {
    // First get all brokerage owners
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        user_roles!inner(role)
      `)
      .eq('user_roles.role', 'brokerage_owner');

    if (profilesError) {
      console.error('Get brokerage owner profiles error:', profilesError);
      throw profilesError;
    }

    console.log('All brokerage owner profiles:', profilesData);

    if (!profilesData || profilesData.length === 0) {
      console.log('No brokerage owners found');
      return [];
    }

    // Get existing brokerages to filter out owners who already have one
    const { data: existingBrokerages, error: brokeragesError } = await supabase
      .from('brokerages')
      .select('owner_id');

    if (brokeragesError) {
      console.error('Get existing brokerages error:', brokeragesError);
      throw brokeragesError;
    }

    console.log('Existing brokerages:', existingBrokerages);

    const ownersWithBrokerages = new Set(existingBrokerages?.map(b => b.owner_id) || []);
    
    // Filter out owners who already have a brokerage
    const availableOwners = profilesData.filter((profile: any) => 
      !ownersWithBrokerages.has(profile.id)
    );

    console.log('Available brokerage owners:', availableOwners);
    return availableOwners || [];
  } catch (error) {
    console.error('getAvailableBrokerageOwners failed:', error);
    throw error;
  }
};

export const createBrokerageForOwner = async (data: CreateBrokerageData) => {
  console.log('Creating brokerage for owner:', data);
  
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
    // Return 0 as fallback instead of throwing
    return 0;
  }
};

export const getTotalBrokeragesCount = async (): Promise<number> => {
  console.log('Getting total brokerages count');
  
  try {
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
    // Return 0 as fallback instead of throwing
    return 0;
  }
};

export const getTotalProjectsCount = async (): Promise<number> => {
  console.log('Getting total projects count');
  
  try {
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
    // Return 0 as fallback instead of throwing
    return 0;
  }
};
