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

  // Parse the response data to get the actual error message
  if (response.data && typeof response.data === 'object' && 'error' in response.data) {
    console.error('Create brokerage owner API error:', response.data.error);
    throw new Error(response.data.error as string);
  }

  console.log('Brokerage owner created successfully:', response.data);
  return response.data;
};

export const getAllBrokerageOwners = async (): Promise<BrokerageOwnerInfo[]> => {
  console.log('Getting all brokerage owners');
  
  try {
    // Step 1: Get all user IDs that have the brokerage_owner role
    const { data: userRolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'brokerage_owner');

    if (rolesError) {
      console.error('Get user roles error:', rolesError);
      throw rolesError;
    }

    console.log('User roles data:', userRolesData);

    if (!userRolesData || userRolesData.length === 0) {
      console.log('No brokerage owners found');
      return [];
    }

    const userIds = userRolesData.map(ur => ur.user_id);
    console.log('Looking for profiles with user IDs:', userIds);
    
    // Step 2: Use a simpler query approach - join directly instead of using .in()
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles!inner(role)
      `)
      .eq('user_roles.role', 'brokerage_owner');

    if (profilesError) {
      console.error('Get profiles with roles error:', profilesError);
      
      // Fallback: try a different approach if join doesn't work
      console.log('Trying fallback approach with individual queries...');
      const profiles = [];
      
      for (const userId of userIds) {
        const { data: profile, error: singleProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (singleProfileError) {
          console.error(`Error fetching profile for user ${userId}:`, singleProfileError);
          continue;
        }
        
        if (profile) {
          profiles.push(profile);
        }
      }
      
      if (profiles.length === 0) {
        console.log('No profiles found even with fallback approach');
        return [];
      }
      
      // Use the fallback profiles data
      console.log('Fallback profiles data:', profiles);
      
      // Step 3: Get brokerage information for owners who have one
      const { data: brokeragesData, error: brokeragesError } = await supabase
        .from('brokerages')
        .select('id, name, owner_id')
        .in('owner_id', profiles.map(p => p.id));

      if (brokeragesError) {
        console.error('Get brokerages error:', brokeragesError);
        // Don't throw here, just log and continue without brokerage info
      }

      console.log('Brokerages data:', brokeragesData);

      // Step 4: Map profiles to brokerage owner info
      const brokerageOwners = profiles.map((profile) => {
        const brokerage = brokeragesData?.find(b => b.owner_id === profile.id);
        
        return {
          ...profile,
          owns_brokerage: !!brokerage,
          brokerage_name: brokerage?.name || null,
        };
      });

      console.log('Processed brokerage owners (fallback):', brokerageOwners);
      return brokerageOwners;
    }

    console.log('Profiles data from join:', profilesData);

    if (!profilesData || profilesData.length === 0) {
      console.log('No profiles found for brokerage owners from join query');
      return [];
    }

    // Step 3: Get brokerage information for owners who have one
    const { data: brokeragesData, error: brokeragesError } = await supabase
      .from('brokerages')
      .select('id, name, owner_id')
      .in('owner_id', profilesData.map(p => p.id));

    if (brokeragesError) {
      console.error('Get brokerages error:', brokeragesError);
      // Don't throw here, just log and continue without brokerage info
    }

    console.log('Brokerages data:', brokeragesData);

    // Step 4: Map profiles to brokerage owner info
    const brokerageOwners = profilesData.map((profile) => {
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
    // Use the same improved approach as getAllBrokerageOwners
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
      console.error('Get profiles with roles error:', profilesError);
      
      // Fallback approach
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'brokerage_owner');

      if (rolesError || !userRolesData) {
        throw rolesError || new Error('No user roles found');
      }

      const profiles = [];
      for (const userRole of userRolesData) {
        const { data: profile, error: singleProfileError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .eq('id', userRole.user_id)
          .maybeSingle();
          
        if (!singleProfileError && profile) {
          profiles.push(profile);
        }
      }
      
      console.log('Fallback profiles for available owners:', profiles);
      
      if (profiles.length === 0) {
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

      const ownersWithBrokerages = new Set(existingBrokerages?.map(b => b.owner_id) || []);
      
      const availableOwners = profiles.filter((profile) => 
        !ownersWithBrokerages.has(profile.id)
      );

      console.log('Available brokerage owners (fallback):', availableOwners);
      return availableOwners || [];
    }

    console.log('All brokerage owner profiles from join:', profilesData);

    if (!profilesData || profilesData.length === 0) {
      console.log('No profiles found for brokerage owners');
      return [];
    }

    // Step 3: Get existing brokerages to filter out owners who already have one
    const { data: existingBrokerages, error: brokeragesError } = await supabase
      .from('brokerages')
      .select('owner_id');

    if (brokeragesError) {
      console.error('Get existing brokerages error:', brokeragesError);
      throw brokeragesError;
    }

    console.log('Existing brokerages:', existingBrokerages);

    const ownersWithBrokerages = new Set(existingBrokerages?.map(b => b.owner_id) || []);
    
    // Step 4: Filter out owners who already have a brokerage
    const availableOwners = profilesData.filter((profile) => 
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
