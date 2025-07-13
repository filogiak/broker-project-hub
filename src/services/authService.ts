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
  console.log('👤 [AUTH SERVICE] ===== Getting current user =====');
  
  try {
    // Step 1: Validate session before attempting to get user data
    console.log('👤 [AUTH SERVICE] Step 1: Validating session...');
    const { valid, session } = await validateSessionBeforeOperation();
    
    console.log('👤 [AUTH SERVICE] Session validation result:', {
      valid,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionExpiry: session?.expires_at,
      tokenPresent: !!session?.access_token
    });
    
    if (!valid || !session?.user) {
      console.log('❌ [AUTH SERVICE] No valid session for getCurrentUser');
      return null;
    }

    const user = session.user;
    console.log('👤 [AUTH SERVICE] Step 2: Session valid, user ID:', user.id);

    // Step 3: Get user profile with detailed logging
    console.log('👤 [AUTH SERVICE] Step 3: Fetching user profile...');
    
    // Log the exact query being made
    console.log('👤 [AUTH SERVICE] Profile query: SELECT * FROM profiles WHERE id =', user.id);
    
    const profileStart = performance.now();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    const profileEnd = performance.now();

    console.log('👤 [AUTH SERVICE] Profile query completed in', (profileEnd - profileStart).toFixed(2), 'ms');
    
    if (profileError) {
      console.error('❌ [AUTH SERVICE] Profile query error:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        fullError: profileError
      });
      
      // Check if it's a permissions/RLS issue
      if (profileError.code === 'PGRST116' || profileError.message?.includes('row-level security')) {
        console.error('🔒 [AUTH SERVICE] RLS POLICY ISSUE: User cannot access their own profile');
        console.error('🔒 [AUTH SERVICE] auth.uid():', user.id);
        console.error('🔒 [AUTH SERVICE] This indicates an RLS policy problem on the profiles table');
      }
      
      throw new Error(`Profile query failed: ${profileError.message} (Code: ${profileError.code})`);
    }

    if (!profile) {
      console.error('❌ [AUTH SERVICE] No profile found for user ID:', user.id);
      throw new Error(`No profile found for user ${user.id}`);
    }

    console.log('✅ [AUTH SERVICE] Profile found:', {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      brokerageId: profile.brokerage_id
    });

    // Step 4: Get user roles with detailed logging
    console.log('👤 [AUTH SERVICE] Step 4: Fetching user roles...');
    
    // Log the exact query being made
    console.log('👤 [AUTH SERVICE] Roles query: SELECT role FROM user_roles WHERE user_id =', user.id);
    
    const rolesStart = performance.now();
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    const rolesEnd = performance.now();

    console.log('👤 [AUTH SERVICE] Roles query completed in', (rolesEnd - rolesStart).toFixed(2), 'ms');

    if (rolesError) {
      console.error('❌ [AUTH SERVICE] Roles query error:', {
        code: rolesError.code,
        message: rolesError.message,
        details: rolesError.details,
        hint: rolesError.hint,
        fullError: rolesError
      });
      
      // Check if it's a permissions/RLS issue
      if (rolesError.code === 'PGRST116' || rolesError.message?.includes('row-level security')) {
        console.error('🔒 [AUTH SERVICE] RLS POLICY ISSUE: User cannot access their roles');
        console.error('🔒 [AUTH SERVICE] auth.uid():', user.id);
        console.error('🔒 [AUTH SERVICE] This indicates an RLS policy problem on the user_roles table');
      }
      
      throw new Error(`Roles query failed: ${rolesError.message} (Code: ${rolesError.code})`);
    }

    console.log('✅ [AUTH SERVICE] Roles found:', userRoles?.map(ur => ur.role) || []);

    // Step 5: Build auth user object
    console.log('👤 [AUTH SERVICE] Step 5: Building auth user object...');
    const authUser: AuthUser = {
      id: user.id,
      email: profile.email,
      firstName: profile.first_name || undefined,
      lastName: profile.last_name || undefined,
      phone: profile.phone || undefined,
      brokerageId: profile.brokerage_id || undefined,
      roles: userRoles?.map(ur => ur.role) || [],
    };

    console.log('✅ [AUTH SERVICE] ===== Current user loaded successfully =====:', {
      email: authUser.email,
      roles: authUser.roles,
      brokerageId: authUser.brokerageId
    });
    
    return authUser;
  } catch (error) {
    console.error('❌ [AUTH SERVICE] ===== CRITICAL: Failed to get current user =====');
    console.error('❌ [AUTH SERVICE] Error type:', typeof error);
    console.error('❌ [AUTH SERVICE] Error instance:', error instanceof Error);
    console.error('❌ [AUTH SERVICE] Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ [AUTH SERVICE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ [AUTH SERVICE] Full error object:', error);
    
    // Re-throw with more context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Authentication failed: ${errorMessage}`);
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
