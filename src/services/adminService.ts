
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface AvailableOwner {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

export interface BrokerageOwnerInfo {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  brokerage_id: string | null;
  brokerage_name: string | null;
  owns_brokerage: boolean;
}

export interface BrokerageInfo {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  owner_email: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
  created_at: string;
}

export const createBrokerageOwner = async (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => {
  console.log('Creating brokerage owner:', email);
  
  // Create the user account
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email for admin-created users
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
    },
  });

  if (authError) {
    console.error('Create user auth error:', authError);
    throw authError;
  }

  if (!authData.user) {
    throw new Error('User creation failed');
  }

  // Assign the brokerage_owner role
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert([{ user_id: authData.user.id, role: 'brokerage_owner' }]);

  if (roleError) {
    console.error('Assign role error:', roleError);
    throw roleError;
  }

  console.log('Brokerage owner created successfully:', authData.user.email);
  return authData.user;
};

export const createBrokerageForOwner = async (brokerageData: {
  name: string;
  description?: string;
  ownerId: string;
}) => {
  console.log('Creating brokerage for owner:', brokerageData.ownerId);
  
  // Create the brokerage
  const { data: brokerage, error: brokerageError } = await supabase
    .from('brokerages')
    .insert([{
      name: brokerageData.name,
      description: brokerageData.description,
      owner_id: brokerageData.ownerId,
    }])
    .select('*')
    .single();

  if (brokerageError) {
    console.error('Create brokerage error:', brokerageError);
    throw brokerageError;
  }

  // Update the owner's profile to link to this brokerage
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ brokerage_id: brokerage.id })
    .eq('id', brokerageData.ownerId);

  if (profileError) {
    console.error('Update profile error:', profileError);
    throw profileError;
  }

  console.log('Brokerage created successfully:', brokerage.name);
  return brokerage;
};

export const getAvailableBrokerageOwners = async (): Promise<AvailableOwner[]> => {
  console.log('Getting available brokerage owners');
  
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      first_name,
      last_name,
      phone,
      user_roles!inner(role)
    `)
    .eq('user_roles.role', 'brokerage_owner')
    .is('brokerage_id', null);

  if (error) {
    console.error('Get available brokerage owners error:', error);
    throw error;
  }

  return data || [];
};

export const getAllBrokerageOwners = async (): Promise<BrokerageOwnerInfo[]> => {
  console.log('Getting all brokerage owners');
  
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      first_name,
      last_name,
      phone,
      brokerage_id,
      brokerages(name),
      user_roles!inner(role)
    `)
    .eq('user_roles.role', 'brokerage_owner');

  if (error) {
    console.error('Get all brokerage owners error:', error);
    throw error;
  }

  return (data || []).map(owner => ({
    id: owner.id,
    email: owner.email,
    first_name: owner.first_name,
    last_name: owner.last_name,
    phone: owner.phone,
    brokerage_id: owner.brokerage_id,
    brokerage_name: owner.brokerages?.[0]?.name || null,
    owns_brokerage: !!owner.brokerage_id,
  }));
};

export const getAllBrokerages = async (): Promise<BrokerageInfo[]> => {
  console.log('Getting all brokerages');
  
  const { data, error } = await supabase
    .from('brokerages')
    .select(`
      *,
      profiles!owner_id(
        email,
        first_name,
        last_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get all brokerages error:', error);
    throw error;
  }

  return (data || []).map(brokerage => ({
    id: brokerage.id,
    name: brokerage.name,
    description: brokerage.description,
    owner_id: brokerage.owner_id,
    owner_email: brokerage.profiles?.email || '',
    owner_first_name: brokerage.profiles?.first_name || null,
    owner_last_name: brokerage.profiles?.last_name || null,
    created_at: brokerage.created_at,
  }));
};

export const getTotalUsersCount = async (): Promise<number> => {
  console.log('Getting total users count');
  
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Get total users count error:', error);
    throw error;
  }

  return count || 0;
};

export const getTotalBrokeragesCount = async (): Promise<number> => {
  console.log('Getting total brokerages count');
  
  const { count, error } = await supabase
    .from('brokerages')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Get total brokerages count error:', error);
    throw error;
  }

  return count || 0;
};

export const getTotalProjectsCount = async (): Promise<number> => {
  console.log('Getting total projects count');
  
  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Get total projects count error:', error);
    throw error;
  }

  return count || 0;
};
