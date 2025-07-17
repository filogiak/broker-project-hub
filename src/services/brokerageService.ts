
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface BrokerageWithAccess extends Brokerage {
  access_type: 'owner' | 'member';
}

export const getBrokerageByOwner = async (ownerId: string): Promise<Brokerage | null> => {
  const { data, error } = await supabase
    .from('brokerages')
    .select('*')
    .eq('owner_id', ownerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw error;
  }

  return data;
};

export const getBrokerageByAccess = async (userId?: string): Promise<BrokerageWithAccess | null> => {
  const { data, error } = await supabase.rpc('get_brokerage_by_access', {
    user_uuid: userId || undefined
  });

  if (error) {
    console.error('Error getting brokerage by access:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0] as BrokerageWithAccess;
};

export const createBrokerage = async (brokerageData: {
  name: string;
  description?: string;
  ownerId: string;
}): Promise<Brokerage> => {
  const { data, error } = await supabase
    .from('brokerages')
    .insert({
      name: brokerageData.name,
      description: brokerageData.description,
      owner_id: brokerageData.ownerId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBrokerage = async (
  brokerageId: string,
  updates: {
    name?: string;
    description?: string;
  }
): Promise<Brokerage> => {
  const { data, error } = await supabase
    .from('brokerages')
    .update(updates)
    .eq('id', brokerageId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Alias for updateBrokerage to match component expectation
export const updateBrokerageProfile = updateBrokerage;

export const updateOwnerProfile = async (
  profileId: string,
  updates: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  }
): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBrokerage = async (brokerageId: string): Promise<void> => {
  const { error } = await supabase
    .from('brokerages')
    .delete()
    .eq('id', brokerageId);

  if (error) throw error;
};

export const getBrokerageMembers = async (brokerageId: string) => {
  const { data, error } = await supabase
    .from('brokerage_members')
    .select(`
      id,
      role,
      joined_at,
      invited_at,
      profiles:user_id (
        id,
        email,
        first_name,
        last_name
      )
    `)
    .eq('brokerage_id', brokerageId);

  if (error) throw error;
  return data;
};

export const getBrokerageInvitations = async (brokerageId: string) => {
  const { data, error } = await supabase.rpc('get_brokerage_outgoing_invitations', {
    p_brokerage_id: brokerageId
  });

  if (error) {
    console.error('Error fetching brokerage invitations:', error);
    throw error;
  }

  return data || [];
};
