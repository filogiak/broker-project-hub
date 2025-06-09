
import { supabase } from '@/integrations/supabase/client';

export interface AuthDebugInfo {
  sessionExists: boolean;
  userExists: boolean;
  userId: string | null;
  sessionUserId: string | null;
  tokenValid: boolean;
  tokenExpiry: string | null;
  dbContextUserId: string | null;
  environment: string;
  sessionFingerprint: string | null;
  error: string | null;
}

export interface SessionConflictInfo {
  hasConflicts: boolean;
  conflictingSessions: string[];
  recommendations: string[];
}

// Environment detection
export const getCurrentEnvironment = (): string => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  } else if (hostname.includes('lovable.app')) {
    return 'preview';
  } else {
    return 'production';
  }
};

// Generate session fingerprint for tracking
export const generateSessionFingerprint = (): string => {
  const env = getCurrentEnvironment();
  const timestamp = new Date().toISOString();
  const random = Math.random().toString(36).substring(2);
  return `${env}_${timestamp}_${random}`;
};

// Enhanced cleanup that handles cross-environment sessions
export const globalSessionCleanup = () => {
  console.log('🧹 [AUTH DEBUG] Starting global session cleanup...');
  
  // Get current environment
  const currentEnv = getCurrentEnvironment();
  console.log('🧹 [AUTH DEBUG] Current environment:', currentEnv);
  
  // Clear all possible Supabase auth keys
  const keysToRemove = [
    'supabase.auth.token',
    'sb-mufcmhgxskkwggtwryol-auth-token',
    'sb-auth-token',
  ];
  
  // Environment-specific keys
  const envSpecificKeys = [
    `sb-${currentEnv}-auth-token`,
    `supabase.auth.token.${currentEnv}`,
  ];
  
  [...keysToRemove, ...envSpecificKeys].forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log('🧹 [AUTH DEBUG] Removed localStorage key:', key);
    }
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      console.log('🧹 [AUTH DEBUG] Removed sessionStorage key:', key);
    }
  });
  
  // Remove all keys that start with supabase.auth or contain sb-
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
      console.log('🧹 [AUTH DEBUG] Removed localStorage key:', key);
    }
  });
  
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
      console.log('🧹 [AUTH DEBUG] Removed sessionStorage key:', key);
    }
  });
  
  console.log('🧹 [AUTH DEBUG] Global session cleanup completed');
};

// Detect session conflicts across environments
export const detectSessionConflicts = async (): Promise<SessionConflictInfo> => {
  console.log('🔍 [AUTH DEBUG] Detecting session conflicts...');
  
  const conflicts: string[] = [];
  const recommendations: string[] = [];
  
  // Check for environment-specific session keys
  const environments = ['localhost', 'preview', 'production'];
  const currentEnv = getCurrentEnvironment();
  
  environments.forEach(env => {
    if (env !== currentEnv) {
      const envKey = `sb-${env}-auth-token`;
      if (localStorage.getItem(envKey) || sessionStorage.getItem(envKey)) {
        conflicts.push(`Active session found for ${env} environment`);
      }
    }
  });
  
  // Check for multiple auth tokens
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('auth') && (key.startsWith('supabase') || key.includes('sb-'))
  );
  
  if (authKeys.length > 1) {
    conflicts.push(`Multiple auth tokens detected: ${authKeys.length} keys`);
    recommendations.push('Clear all sessions and re-login');
  }
  
  // Check session timestamp
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const now = new Date().getTime() / 1000;
      const expiresAt = session.expires_at || 0;
      
      if (expiresAt < now) {
        conflicts.push('Expired session token detected');
        recommendations.push('Refresh session or re-login');
      }
    }
  } catch (error) {
    conflicts.push('Session validation failed');
  }
  
  return {
    hasConflicts: conflicts.length > 0,
    conflictingSessions: conflicts,
    recommendations
  };
};

export const debugAuthState = async (): Promise<AuthDebugInfo> => {
  console.log('🔍 [AUTH DEBUG] Starting comprehensive auth state check...');
  
  const environment = getCurrentEnvironment();
  console.log('🔍 [AUTH DEBUG] Environment:', environment);
  
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
      const { data: rolesData, error: dbError } = await supabase.rpc('get_user_roles');
      if (!dbError && user?.id) {
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

    // Generate session fingerprint
    const sessionFingerprint = session ? generateSessionFingerprint() : null;

    const debugInfo: AuthDebugInfo = {
      sessionExists: !!session,
      userExists: !!user,
      userId: user?.id || null,
      sessionUserId: session?.user?.id || null,
      tokenValid: !!session?.access_token,
      tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      dbContextUserId,
      environment,
      sessionFingerprint,
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
      environment,
      sessionFingerprint: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Enhanced session refresh with conflict resolution
export const refreshAuthSession = async (): Promise<boolean> => {
  console.log('🔄 [AUTH DEBUG] Attempting to refresh session...');
  
  // First, check for conflicts
  const conflicts = await detectSessionConflicts();
  if (conflicts.hasConflicts) {
    console.warn('⚠️ [AUTH DEBUG] Session conflicts detected:', conflicts);
    globalSessionCleanup();
  }
  
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

// Single session enforcement
export const enforceSingleSession = async (): Promise<void> => {
  console.log('🔒 [AUTH DEBUG] Enforcing single session...');
  
  try {
    // Global cleanup first
    globalSessionCleanup();
    
    // Attempt global signout to clear server-side sessions
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('🔒 [AUTH DEBUG] Global signout completed');
    } catch (error) {
      console.warn('⚠️ [AUTH DEBUG] Global signout failed, continuing:', error);
    }
    
    // Wait a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🔒 [AUTH DEBUG] Single session enforcement completed');
  } catch (error) {
    console.error('❌ [AUTH DEBUG] Single session enforcement failed:', error);
  }
};

export const validateSessionBeforeOperation = async (): Promise<{ valid: boolean; session: any | null }> => {
  console.log('✅ [AUTH DEBUG] Validating session before critical operation...');
  
  // Check for conflicts first
  const conflicts = await detectSessionConflicts();
  if (conflicts.hasConflicts) {
    console.warn('⚠️ [AUTH DEBUG] Session conflicts detected, cleaning up...');
    globalSessionCleanup();
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const debugInfo = await debugAuthState();
  
  if (!debugInfo.sessionExists || !debugInfo.userExists || !debugInfo.dbContextUserId) {
    console.warn('⚠️ [AUTH DEBUG] Invalid session state, attempting recovery...');
    
    const refreshed = await refreshAuthSession();
    if (!refreshed) {
      console.error('❌ [AUTH DEBUG] Session validation failed - no valid session');
      return { valid: false, session: null };
    }
    
    // Re-check after refresh
    const { data: { session } } = await supabase.auth.getSession();
    const secondCheck = await debugAuthState();
    
    if (!secondCheck.dbContextUserId) {
      console.error('❌ [AUTH DEBUG] Database context still invalid after refresh');
      return { valid: false, session: null };
    }
    
    return { valid: !!session, session };
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  console.log('✅ [AUTH DEBUG] Session validation passed');
  return { valid: true, session };
};

// Manual session reset for debugging
export const manualSessionReset = async (): Promise<void> => {
  console.log('🔧 [AUTH DEBUG] Manual session reset initiated...');
  
  await enforceSingleSession();
  
  // Force page reload to ensure clean state
  console.log('🔧 [AUTH DEBUG] Forcing page reload for clean state...');
  window.location.href = '/auth';
};

// Session monitoring utility
export const monitorSessionState = () => {
  const monitor = setInterval(async () => {
    const debugInfo = await debugAuthState();
    const conflicts = await detectSessionConflicts();
    
    if (conflicts.hasConflicts || !debugInfo.dbContextUserId) {
      console.warn('🚨 [SESSION MONITOR] Session issues detected:', {
        debugInfo,
        conflicts
      });
    }
  }, 30000); // Check every 30 seconds
  
  return () => clearInterval(monitor);
};

// Legacy function names for backward compatibility
export const cleanupAuthState = globalSessionCleanup;
