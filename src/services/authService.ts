
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  brokerageId?: string;
  roles: UserRole[];
}

export const login = async (email: string, password: string) => {
  console.log('Attempting login for:', email);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login error:', error);
    throw error;
  }

  console.log('Login successful:', data.user?.email);
  return data;
};

export const logout = async () => {
  console.log('Logging out user');
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Logout error:', error);
    throw error;
  }

  console.log('Logout successful');
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  console.log('Getting current user');
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Get current user error:', error);
    throw error;
  }

  if (!user) {
    console.log('No user found');
    return null;
  }

  // Get user profile and roles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Get profile error:', profileError);
    throw profileError;
  }

  // Get user roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (rolesError) {
    console.error('Get roles error:', rolesError);
    throw rolesError;
  }

  const authUser: AuthUser = {
    id: user.id,
    email: profile.email,
    firstName: profile.first_name || undefined,
    lastName: profile.last_name || undefined,
    phone: profile.phone || undefined,
    brokerageId: profile.brokerage_id || undefined,
    roles: userRoles.map(ur => ur.role),
  };

  console.log('Current user:', authUser);
  return authUser;
};

export const isAuthenticated = async (): Promise<boolean> => {
  console.log('Checking authentication status');
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Authentication check error:', error);
    return false;
  }

  const authenticated = !!user;
  console.log('Authentication status:', authenticated);
  return authenticated;
};

export const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
  console.log('Attempting signup for:', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    console.error('Signup error:', error);
    throw error;
  }

  console.log('Signup successful:', data.user?.email);
  return data;
};

export const assignRole = async (userId: string, role: UserRole) => {
  console.log('Assigning role:', role, 'to user:', userId);
  
  const { data, error } = await supabase
    .from('user_roles')
    .insert([{ user_id: userId, role }]);

  if (error) {
    console.error('Assign role error:', error);
    throw error;
  }

  console.log('Role assigned successfully');
  return data;
};

export const updateProfile = async (updates: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  brokerageId?: string;
}) => {
  console.log('Updating profile:', updates);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  const profileUpdates: any = {};
  if (updates.firstName !== undefined) profileUpdates.first_name = updates.firstName;
  if (updates.lastName !== undefined) profileUpdates.last_name = updates.lastName;
  if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
  if (updates.brokerageId !== undefined) profileUpdates.brokerage_id = updates.brokerageId;

  const { data, error } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', user.id);

  if (error) {
    console.error('Update profile error:', error);
    throw error;
  }

  console.log('Profile updated successfully');
  return data;
};
