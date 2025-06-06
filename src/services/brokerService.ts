
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

export interface BrokerData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  brokerageId: string;
}

export const createBroker = async (brokerData: BrokerData) => {
  console.log('Creating broker:', brokerData);
  
  // First, check if a profile exists for this email
  const { data: existingUser, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', brokerData.email)
    .maybeSingle();

  if (userError) {
    console.error('Error checking existing user:', userError);
    throw userError;
  }

  let userId: string;

  if (existingUser) {
    // Update existing profile
    userId = existingUser.id;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: brokerData.firstName,
        last_name: brokerData.lastName,
        phone: brokerData.phone,
        brokerage_id: brokerData.brokerageId,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Update profile error:', updateError);
      throw updateError;
    }
  } else {
    // This would typically involve inviting the user to sign up
    throw new Error('User must be registered first. Consider using the invitation system.');
  }

  // Assign role
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert([{ user_id: userId, role: brokerData.role }]);

  if (roleError) {
    console.error('Assign role error:', roleError);
    throw roleError;
  }

  console.log('Broker created/updated successfully');
  return { userId };
};

export const getBroker = async (brokerId: string): Promise<Profile> => {
  console.log('Getting broker:', brokerId);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', brokerId)
    .single();

  if (error) {
    console.error('Get broker error:', error);
    throw error;
  }

  console.log('Broker retrieved:', data);
  return data;
};

export const getBrokersByTenant = async (tenantId: string) => {
  console.log('Getting brokers by tenant:', tenantId);
  
  const { data, error } = await supabase
    .rpc('get_brokerage_users', { brokerage_uuid: tenantId });

  if (error) {
    console.error('Get brokers by tenant error:', error);
    throw error;
  }

  console.log('Brokers retrieved:', data);
  return data;
};

export const updateBroker = async (brokerId: string, brokerData: Partial<BrokerData>) => {
  console.log('Updating broker:', brokerId, brokerData);
  
  const profileUpdates: any = {};
  if (brokerData.firstName !== undefined) profileUpdates.first_name = brokerData.firstName;
  if (brokerData.lastName !== undefined) profileUpdates.last_name = brokerData.lastName;
  if (brokerData.phone !== undefined) profileUpdates.phone = brokerData.phone;
  if (brokerData.brokerageId !== undefined) profileUpdates.brokerage_id = brokerData.brokerageId;

  const { data, error } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', brokerId)
    .select()
    .single();

  if (error) {
    console.error('Update broker error:', error);
    throw error;
  }

  // Update role if provided
  if (brokerData.role) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert([{ user_id: brokerId, role: brokerData.role }]);

    if (roleError) {
      console.error('Update role error:', roleError);
      throw roleError;
    }
  }

  console.log('Broker updated successfully:', data);
  return data;
};

export const deleteBroker = async (brokerId: string): Promise<void> => {
  console.log('Deleting broker:', brokerId);
  
  // Remove user roles first
  const { error: roleError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', brokerId);

  if (roleError) {
    console.error('Delete broker roles error:', roleError);
    throw roleError;
  }

  // Note: We don't delete the profile as it might be referenced elsewhere
  // Instead, we could set brokerage_id to null
  const { error } = await supabase
    .from('profiles')
    .update({ brokerage_id: null })
    .eq('id', brokerId);

  if (error) {
    console.error('Remove broker from brokerage error:', error);
    throw error;
  }

  console.log('Broker removed from brokerage successfully');
};
