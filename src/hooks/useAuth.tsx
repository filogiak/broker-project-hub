
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser, type AuthUser } from '@/services/authService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  sessionError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user authentication state...');
      setSessionError(null);
      
      // Check current session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        setSessionError(sessionError.message);
        setUser(null);
        return;
      }

      if (!session) {
        console.log('📤 No active session found');
        setUser(null);
        return;
      }

      console.log('✅ Active session found, loading user data...');
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      console.log('✅ User data loaded successfully:', currentUser?.email);
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      setSessionError(errorMessage);
      
      // If it's an auth session missing error, clear the user
      if (errorMessage.includes('Auth session missing') || errorMessage.includes('invalid JWT')) {
        console.log('🔄 Clearing invalid session...');
        setUser(null);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initial user load
    const initAuth = async () => {
      await refreshUser();
      if (mounted) {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.email);
      
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setSessionError(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('👤 User signed in or token refreshed');
        setSessionError(null);
        // Defer user data loading to prevent potential deadlocks
        setTimeout(() => {
          if (mounted) {
            refreshUser();
          }
        }, 100);
      } else if (event === 'USER_UPDATED') {
        console.log('📝 User updated');
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
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, sessionError }}>
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
