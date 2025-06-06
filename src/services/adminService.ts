
import { supabase } from '@/integrations/supabase/client';
import { signUp, assignRole, updateProfile } from './authService';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

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

export const createBrokerageOwner = async (data: CreateBrokerageOwnerData) => {
  console.log('Creating brokerage owner:', data.email);
  
  try {
    // Create the user account
    const signUpResult = await signUp(data.email, data.password, data.firstName, data.lastName);
    
    if (!signUpResult.user) {
      throw new Error('Failed to create user account');
    }

    // Assign brokerage_owner role
    await assignRole(signUpResult.user.id, 'brokerage_owner');

    // Update profile with additional info
    const profileUpdates: any = {};
    if (data.phone) profileUpdates.phone = data.phone;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', signUpResult.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }
    }

    console.log('Brokerage owner created successfully');
    return signUpResult.user;
  } catch (error) {
    console.error('Create brokerage owner error:', error);
    throw error;
  }
};

export const createBrokerageForOwner = async (data: CreateBrokerageData) => {
  console.log('Creating brokerage for owner:', data.ownerId);
  
  try {
    // Create the brokerage
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

    // Update the owner's profile to link to this brokerage
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ brokerage_id: brokerage.id })
      .eq('id', data.ownerId);

    if (profileError) {
      console.error('Update profile error:', profileError);
      throw profileError;
    }

    console.log('Brokerage created and linked successfully');
    return brokerage;
  } catch (error) {
    console.error('Create brokerage for owner error:', error);
    throw error;
  }
};

export const getAvailableBrokerageOwners = async () => {
  console.log('Getting available brokerage owners');
  
  const { data, error } = await supabase
    .rpc('get_available_brokerage_owners');

  if (error) {
    console.error('Get available brokerage owners error:', error);
    throw error;
  }

  console.log('Available brokerage owners retrieved:', data);
  return data;
};

export const getAllBrokerageOwners = async (): Promise<BrokerageOwnerInfo[]> => {
  console.log('Getting all brokerage owners');
  
  const { data, error } = await supabase
    .rpc('get_all_brokerage_owners');

  if (error) {
    console.error('Get all brokerage owners error:', error);
    throw error;
  }

  console.log('All brokerage owners retrieved:', data);
  return data;
};

export const getAllBrokerages = async () => {
  console.log('Getting all brokerages');
  
  const { data, error } = await supabase
    .from('brokerages')
    .select(`
      *,
      profiles!brokerages_owner_id_fkey(
        first_name,
        last_name,
        email
      )
    `);

  if (error) {
    console.error('Get all brokerages error:', error);
    throw error;
  }

  console.log('All brokerages retrieved:', data);
  return data;
};
