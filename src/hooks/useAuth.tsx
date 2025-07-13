
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser, type AuthUser } from '@/services/authService';
import { debugAuthState, globalSessionCleanup, detectSessionConflicts, monitorSessionState } from '@/services/authDebugService';
import { testRLSPolicies, logDatabaseConnectionInfo } from '@/services/rlsDebugService';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  sessionError: string | null;
  forceSessionReset: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const forceSessionReset = async () => {
    console.log('🔧 [AUTH PROVIDER] Force session reset initiated...');
    setSessionError(null);
    
    // Clean up everything
    globalSessionCleanup();
    
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.warn('⚠️ [AUTH PROVIDER] Global signout failed during reset:', error);
    }
    
    setUser(null);
    setSession(null);
    
    // Force page reload
    window.location.href = '/auth';
  };

  const refreshUser = async () => {
    console.log('🔄 [AUTH PROVIDER] ===== Starting refreshUser =====');
    
    try {
      console.log('🔄 [AUTH PROVIDER] Step 1: Clearing any existing errors...');
      setSessionError(null);
      
      // Check for session conflicts first
      console.log('🔄 [AUTH PROVIDER] Step 2: Checking for session conflicts...');
      const conflicts = await detectSessionConflicts();
      console.log('🔄 [AUTH PROVIDER] Session conflicts result:', conflicts);
      
      if (conflicts.hasConflicts) {
        console.warn('⚠️ [AUTH PROVIDER] Session conflicts detected, cleaning up...', conflicts);
        globalSessionCleanup();
        
        // Wait for cleanup
        console.log('🔄 [AUTH PROVIDER] Waiting for cleanup to complete...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Enhanced debugging
      console.log('🔄 [AUTH PROVIDER] Step 3: Running auth debug diagnostics...');
      const authDebug = await debugAuthState();
      console.log('🔄 [AUTH PROVIDER] Auth debug state:', authDebug);
      
      // Check current session
      console.log('🔄 [AUTH PROVIDER] Step 4: Getting current session from Supabase...');
      const sessionStart = performance.now();
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      const sessionEnd = performance.now();
      
      console.log('🔄 [AUTH PROVIDER] Session query completed in', (sessionEnd - sessionStart).toFixed(2), 'ms');
      console.log('🔄 [AUTH PROVIDER] Session result:', {
        hasSession: !!currentSession,
        hasUser: !!currentSession?.user,
        sessionError: !!sessionError,
        userId: currentSession?.user?.id,
        userEmail: currentSession?.user?.email,
        tokenPresent: !!currentSession?.access_token,
        expiresAt: currentSession?.expires_at
      });
      
      if (sessionError) {
        console.error('❌ [AUTH PROVIDER] Session error:', {
          message: sessionError.message,
          status: sessionError.status,
          fullError: sessionError
        });
        setSessionError(sessionError.message);
        setUser(null);
        setSession(null);
        return;
      }

      if (!currentSession) {
        console.log('📤 [AUTH PROVIDER] No active session found - user not logged in');
        setUser(null);
        setSession(null);
        return;
      }

      // Validate session integrity
      console.log('🔄 [AUTH PROVIDER] Step 5: Validating session integrity...');
      if (!authDebug.dbContextUserId && currentSession.user) {
        console.warn('⚠️ [AUTH PROVIDER] Session exists but DB context invalid:', {
          sessionUserId: currentSession.user.id,
          dbContextUserId: authDebug.dbContextUserId,
          sessionValid: authDebug.sessionExists,
          userValid: authDebug.userExists
        });
        setSessionError('Session context invalid - please log in again');
        setUser(null);
        setSession(null);
        return;
      }

      console.log('✅ [AUTH PROVIDER] Step 6: Session validated, setting session state...');
      setSession(currentSession);
      
      console.log('✅ [AUTH PROVIDER] Step 7: Loading user data via getCurrentUser()...');
      const userDataStart = performance.now();
      const currentUser = await getCurrentUser();
      const userDataEnd = performance.now();
      
      console.log('✅ [AUTH PROVIDER] User data loaded in', (userDataEnd - userDataStart).toFixed(2), 'ms');
      console.log('✅ [AUTH PROVIDER] Setting user state:', {
        email: currentUser?.email,
        roles: currentUser?.roles,
        brokerageId: currentUser?.brokerageId
      });
      
      setUser(currentUser);
      console.log('✅ [AUTH PROVIDER] ===== refreshUser completed successfully =====');
      
    } catch (error) {
      console.error('❌ [AUTH PROVIDER] ===== CRITICAL: refreshUser failed =====');
      console.error('❌ [AUTH PROVIDER] Error type:', typeof error);
      console.error('❌ [AUTH PROVIDER] Error instance:', error instanceof Error);
      console.error('❌ [AUTH PROVIDER] Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ [AUTH PROVIDER] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❌ [AUTH PROVIDER] Full error object:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      console.error('❌ [AUTH PROVIDER] Setting session error:', errorMessage);
      
      // Run comprehensive RLS and database debugging when errors occur
      console.log('🔍 [AUTH PROVIDER] Running comprehensive debugging due to error...');
      
      // Log database connection info
      await logDatabaseConnectionInfo();
      
      // Test RLS policies if we have a session
      const { data: { session: debugSession } } = await supabase.auth.getSession();
      if (debugSession?.user) {
        console.log('🔍 [AUTH PROVIDER] Testing RLS policies for debugging...');
        const rlsResults = await testRLSPolicies();
        console.log('🔍 [AUTH PROVIDER] RLS test results:', rlsResults);
        
        // If RLS tests reveal issues, add them to the error message
        if (!rlsResults.success) {
          setSessionError(`${errorMessage} (RLS Debug: ${rlsResults.error})`);
        } else if (rlsResults.results) {
          const failedTests = Object.entries(rlsResults.results.tests)
            .filter(([_, test]: [string, any]) => !test.success)
            .map(([testName, test]: [string, any]) => `${testName}: ${test.error}`);
          
          if (failedTests.length > 0) {
            setSessionError(`${errorMessage} (Failed tests: ${failedTests.join(', ')})`);
          } else {
            setSessionError(errorMessage);
          }
        } else {
          setSessionError(errorMessage);
        }
      } else {
        setSessionError(errorMessage);
      }
      
      // If it's an auth session missing error, clear the user
      if (errorMessage.includes('Auth session missing') || 
          errorMessage.includes('invalid JWT') || 
          errorMessage.includes('session not found') ||
          errorMessage.includes('Profile query failed') ||
          errorMessage.includes('Roles query failed') ||
          errorMessage.includes('row-level security')) {
        console.log('🔄 [AUTH PROVIDER] Error indicates session/auth issue, clearing user state...');
        setUser(null);
        setSession(null);
      }
      
      console.error('❌ [AUTH PROVIDER] ===== refreshUser error handling complete =====');
    }
  };

  useEffect(() => {
    let mounted = true;
    let stopMonitoring: (() => void) | undefined;

    // Initial user load
    const initAuth = async () => {
      await refreshUser();
      if (mounted) {
        setLoading(false);
        
        // Start session monitoring for authenticated users
        if (session) {
          stopMonitoring = monitorSessionState();
        }
      }
    };

    initAuth();

    // Listen for auth changes with enhanced logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 [AUTH PROVIDER] Auth state changed:', event, session?.user?.email);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 [AUTH PROVIDER] User signed out');
        setUser(null);
        setSession(null);
        setSessionError(null);
        globalSessionCleanup();
        
        if (stopMonitoring) {
          stopMonitoring();
          stopMonitoring = undefined;
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('👤 [AUTH PROVIDER] User signed in or token refreshed');
        setSessionError(null);
        setSession(session);
        
        // Defer user data loading to prevent potential deadlocks
        setTimeout(() => {
          if (mounted) {
            refreshUser().then(() => {
              if (!stopMonitoring && session) {
                stopMonitoring = monitorSessionState();
              }
            });
          }
        }, 100);
      } else if (event === 'USER_UPDATED') {
        console.log('📝 [AUTH PROVIDER] User updated');
        setSession(session);
        setTimeout(() => {
          if (mounted) {
            refreshUser();
          }
        }, 100);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (stopMonitoring) {
        stopMonitoring();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      refreshUser, 
      sessionError, 
      forceSessionReset 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
