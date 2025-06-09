
import { supabase } from '@/integrations/supabase/client';

export interface AuthDebugInfo {
  sessionExists: boolean;
  userExists: boolean;
  userId: string | null;
  sessionUserId: string | null;
  tokenValid: boolean;
  tokenExpiry: string | null;
  dbContextUserId: string | null;
  error: string | null;
}

export const debugAuthState = async (): Promise<AuthDebugInfo> => {
  console.log('🔍 [AUTH DEBUG] Starting comprehensive auth state check...');
  
  try {
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔍 [AUTH DEBUG] Session check:', { session: !!session, error: sessionError });

    // Check user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🔍 [AUTH DEBUG] User check:', { user: !!user, error: userError });

    // Check database context by testing a simple query that uses auth.uid()
    let dbContextUserId: string | null = null;
    try {
      // Test if auth.uid() works by trying to get user roles (which requires auth)
      const { data: rolesData, error: dbError } = await supabase.rpc('get_user_roles');
      if (!dbError && user?.id) {
        // If the query succeeded, auth.uid() is working
        dbContextUserId = user.id;
      }
      console.log('🔍 [AUTH DEBUG] Database auth context test:', { 
        dbContextUserId, 
        rolesQuerySuccess: !dbError,
        error: dbError 
      });
    } catch (err) {
      console.log('🔍 [AUTH DEBUG] Database auth context test failed:', err);
    }

    const debugInfo: AuthDebugInfo = {
      sessionExists: !!session,
      userExists: !!user,
      userId: user?.id || null,
      sessionUserId: session?.user?.id || null,
      tokenValid: !!session?.access_token,
      tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      dbContextUserId,
      error: sessionError?.message || userError?.message || null
    };

    console.log('🔍 [AUTH DEBUG] Complete auth state:', debugInfo);
    return debugInfo;

  } catch (error) {
    console.error('🔍 [AUTH DEBUG] Auth state check failed:', error);
    return {
      sessionExists: false,
      userExists: false,
      userId: null,
      sessionUserId: null,
      tokenValid: false,
      tokenExpiry: null,
      dbContextUserId: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const refreshAuthSession = async (): Promise<boolean> => {
  console.log('🔄 [AUTH DEBUG] Attempting to refresh session...');
  
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('🔄 [AUTH DEBUG] Session refresh failed:', error);
      return false;
    }

    console.log('🔄 [AUTH DEBUG] Session refreshed successfully:', !!data.session);
    return !!data.session;

  } catch (error) {
    console.error('🔄 [AUTH DEBUG] Session refresh error:', error);
    return false;
  }
};

export const cleanupAuthState = () => {
  console.log('🧹 [AUTH DEBUG] Cleaning up auth state...');
  
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
      console.log('🧹 [AUTH DEBUG] Removed localStorage key:', key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
      console.log('🧹 [AUTH DEBUG] Removed sessionStorage key:', key);
    }
  });
};

export const validateSessionBeforeOperation = async (): Promise<{ valid: boolean; session: any | null }> => {
  console.log('✅ [AUTH DEBUG] Validating session before critical operation...');
  
  const debugInfo = await debugAuthState();
  
  if (!debugInfo.sessionExists || !debugInfo.userExists) {
    console.warn('⚠️ [AUTH DEBUG] No valid session found, attempting refresh...');
    
    const refreshed = await refreshAuthSession();
    if (!refreshed) {
      console.error('❌ [AUTH DEBUG] Session validation failed - no valid session');
      return { valid: false, session: null };
    }
    
    // Re-check after refresh
    const { data: { session } } = await supabase.auth.getSession();
    return { valid: !!session, session };
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  console.log('✅ [AUTH DEBUG] Session validation passed');
  return { valid: true, session };
};
