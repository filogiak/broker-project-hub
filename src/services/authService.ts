import { supabase } from '@/integrations/supabase/client';
import { enforceSingleSession, validateSessionBeforeOperation, globalSessionCleanup } from './authDebugService';
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
  console.log('🔐 [AUTH SERVICE] Starting login process for:', email);
  
  // Enforce single session before login
  await enforceSingleSession();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ [AUTH SERVICE] Login error:', error);
      throw error;
    }

    console.log('✅ [AUTH SERVICE] Login successful:', data.user?.email);
    
    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 100);
    
    return data;
  } catch (error) {
    console.error('❌ [AUTH SERVICE] Login failed:', error);
    throw error;
  }
};

export const logout = async () => {
  console.log('👋 [AUTH SERVICE] Starting logout process');
  
  try {
    // Clean up local state first
    globalSessionCleanup();
    
    // Attempt global signout
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.error('⚠️ [AUTH SERVICE] Logout error (continuing):', error);
    }

    console.log('✅ [AUTH SERVICE] Logout completed');
    
    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.href = '/auth';
    }, 100);
    
  } catch (error) {
    console.error('❌ [AUTH SERVICE] Logout failed:', error);
    // Still redirect to auth page
    window.location.href = '/auth';
  }
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  console.log('👤 [AUTH SERVICE] Getting current user');
  
  // Validate session before attempting to get user data
  const { valid, session } = await validateSessionBeforeOperation();
  
  if (!valid || !session?.user) {
    console.log('❌ [AUTH SERVICE] No valid session for getCurrentUser');
    return null;
  }

  const user = session.user;

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ [AUTH SERVICE] Get profile error:', profileError);
      throw profileError;
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('❌ [AUTH SERVICE] Get roles error:', rolesError);
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

    console.log('✅ [AUTH SERVICE] Current user loaded:', authUser.email);
    return authUser;
  } catch (error) {
    console.error('❌ [AUTH SERVICE] Failed to get current user:', error);
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  console.log('🔍 [AUTH SERVICE] Checking authentication status');
  
  const { valid } = await validateSessionBeforeOperation();
  
  console.log('🔍 [AUTH SERVICE] Authentication status:', valid);
  return valid;
};

export const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
  console.log('📝 [AUTH SERVICE] Starting signup process for:', email);
  
  // Enforce single session before signup
  await enforceSingleSession();
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error('❌ [AUTH SERVICE] Signup error:', error);
      throw error;
    }

    console.log('✅ [AUTH SERVICE] Signup successful:', data.user?.email);
    return data;
  } catch (error) {
    console.error('❌ [AUTH SERVICE] Signup failed:', error);
    throw error;
  }
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
