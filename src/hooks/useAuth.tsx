
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser, type AuthUser } from '@/services/authService';
import { debugAuthState, globalSessionCleanup, detectSessionConflicts, monitorSessionState } from '@/services/authDebugService';
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
    try {
      console.log('🔄 [AUTH PROVIDER] Refreshing user authentication state...');
      setSessionError(null);
      
      // Check for session conflicts first
      const conflicts = await detectSessionConflicts();
      if (conflicts.hasConflicts) {
        console.warn('⚠️ [AUTH PROVIDER] Session conflicts detected:', conflicts);
        globalSessionCleanup();
        
        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Enhanced debugging
      const authDebug = await debugAuthState();
      console.log('🔄 [AUTH PROVIDER] Auth debug state:', authDebug);
      
      // Check current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ [AUTH PROVIDER] Session error:', sessionError);
        setSessionError(sessionError.message);
        setUser(null);
        setSession(null);
        return;
      }

      if (!currentSession) {
        console.log('📤 [AUTH PROVIDER] No active session found');
        setUser(null);
        setSession(null);
        return;
      }

      // Validate session integrity
      if (!authDebug.dbContextUserId && currentSession.user) {
        console.warn('⚠️ [AUTH PROVIDER] Session exists but DB context invalid');
        setSessionError('Session context invalid - please log in again');
        setUser(null);
        setSession(null);
        return;
      }

      console.log('✅ [AUTH PROVIDER] Active session found, loading user data...', {
        userId: currentSession.user.id,
        tokenPresent: !!currentSession.access_token,
        dbContext: authDebug.dbContextUserId
      });
      
      // Set session first
      setSession(currentSession);
      
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      console.log('✅ [AUTH PROVIDER] User data loaded successfully:', currentUser?.email);
    } catch (error) {
      console.error('❌ [AUTH PROVIDER] Error refreshing user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      setSessionError(errorMessage);
      
      // If it's an auth session missing error, clear the user
      if (errorMessage.includes('Auth session missing') || 
          errorMessage.includes('invalid JWT') || 
          errorMessage.includes('session not found')) {
        console.log('🔄 [AUTH PROVIDER] Clearing invalid session...');
        setUser(null);
        setSession(null);
      }
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
