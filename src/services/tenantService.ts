
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type BrokerageInsert = Database['public']['Tables']['brokerages']['Insert'];
type BrokerageUpdate = Database['public']['Tables']['brokerages']['Update'];

export const createTenant = async (tenantData: {
  name: string;
  description?: string;
}): Promise<Brokerage> => {
  console.log('Creating brokerage:', tenantData);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create a brokerage');
  }

  const brokerageData: BrokerageInsert = {
    name: tenantData.name,
    description: tenantData.description,
    owner_id: user.id,
  };

  const { data, error } = await supabase
    .from('brokerages')
    .insert([brokerageData])
    .select()
    .single();

  if (error) {
    console.error('Create brokerage error:', error);
    throw error;
  }

  console.log('Brokerage created successfully:', data);
  return data;
};

export const getTenant = async (tenantId: string): Promise<Brokerage> => {
  console.log('Getting brokerage:', tenantId);
  
  const { data, error } = await supabase
    .from('brokerages')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error) {
    console.error('Get brokerage error:', error);
    throw error;
  }

  console.log('Brokerage retrieved:', data);
  return data;
};

export const updateTenant = async (tenantId: string, tenantData: {
  name?: string;
  description?: string;
}): Promise<Brokerage> => {
  console.log('Updating brokerage:', tenantId, tenantData);
  
  const updateData: BrokerageUpdate = {};
  if (tenantData.name !== undefined) updateData.name = tenantData.name;
  if (tenantData.description !== undefined) updateData.description = tenantData.description;

  const { data, error } = await supabase
    .from('brokerages')
    .update(updateData)
    .eq('id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Update brokerage error:', error);
    throw error;
  }

  console.log('Brokerage updated successfully:', data);
  return data;
};

export const deleteTenant = async (tenantId: string): Promise<void> => {
  console.log('Deleting brokerage:', tenantId);
  
  const { error } = await supabase
    .from('brokerages')
    .delete()
    .eq('id', tenantId);

  if (error) {
    console.error('Delete brokerage error:', error);
    throw error;
  }

  console.log('Brokerage deleted successfully');
};

export const getBrokerageUsers = async (brokerageId: string) => {
  console.log('Getting brokerage users:', brokerageId);
  
  const { data, error } = await supabase
    .rpc('get_brokerage_users', { brokerage_uuid: brokerageId });

  if (error) {
    console.error('Get brokerage users error:', error);
    throw error;
  }

  console.log('Brokerage users retrieved:', data);
  return data;
};

export const getUserBrokerages = async () => {
  console.log('Getting user brokerages');
  
  const { data, error } = await supabase
    .from('brokerages')
    .select('*');

  if (error) {
    console.error('Get user brokerages error:', error);
    throw error;
  }

  console.log('User brokerages retrieved:', data);
  return data;
};
