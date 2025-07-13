import { supabase } from '@/integrations/supabase/client';

export const testRLSPolicies = async () => {
  console.log('🔐 [RLS DEBUG] ===== Testing RLS Policies =====');
  
  try {
    // Get current session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('🔐 [RLS DEBUG] Session error:', sessionError);
      return { success: false, error: sessionError.message };
    }
    
    if (!session?.user) {
      console.log('🔐 [RLS DEBUG] No authenticated user');
      return { success: false, error: 'No authenticated user' };
    }
    
    const userId = session.user.id;
    console.log('🔐 [RLS DEBUG] Testing with user ID:', userId);
    
    const results = {
      userId,
      userEmail: session.user.email,
      tests: {} as Record<string, any>
    };
    
    // Test 1: Direct auth.uid() check
    console.log('🔐 [RLS DEBUG] Test 1: Checking auth.uid() function...');
    try {
      const { data: authUidResult, error: authUidError } = await supabase
        .rpc('get_user_roles', { user_uuid: userId });
      
      results.tests.authUidFunction = {
        success: !authUidError,
        error: authUidError?.message,
        result: authUidResult
      };
      
      console.log('🔐 [RLS DEBUG] auth.uid() test result:', results.tests.authUidFunction);
    } catch (error) {
      results.tests.authUidFunction = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 2: Profiles table access
    console.log('🔐 [RLS DEBUG] Test 2: Testing profiles table access...');
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .single();
      
      results.tests.profilesAccess = {
        success: !profileError,
        error: profileError?.message,
        errorCode: profileError?.code,
        found: !!profileData,
        data: profileData
      };
      
      console.log('🔐 [RLS DEBUG] Profiles access test result:', results.tests.profilesAccess);
    } catch (error) {
      results.tests.profilesAccess = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 3: User roles table access
    console.log('🔐 [RLS DEBUG] Test 3: Testing user_roles table access...');
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      results.tests.userRolesAccess = {
        success: !rolesError,
        error: rolesError?.message,
        errorCode: rolesError?.code,
        count: rolesData?.length || 0,
        roles: rolesData?.map(r => r.role) || []
      };
      
      console.log('🔐 [RLS DEBUG] User roles access test result:', results.tests.userRolesAccess);
    } catch (error) {
      results.tests.userRolesAccess = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 4: Check if user exists in database
    console.log('🔐 [RLS DEBUG] Test 4: Checking if user exists in profiles...');
    try {
      // Use a count query to avoid RLS restrictions
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('id', userId);
      
      results.tests.userExists = {
        success: !countError,
        error: countError?.message,
        exists: count !== null && count > 0,
        count
      };
      
      console.log('🔐 [RLS DEBUG] User exists test result:', results.tests.userExists);
    } catch (error) {
      results.tests.userExists = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 5: Raw SQL execution test
    console.log('🔐 [RLS DEBUG] Test 5: Testing raw SQL execution...');
    try {
      const { data: sqlResult, error: sqlError } = await supabase
        .rpc('is_superadmin', { user_uuid: userId });
      
      results.tests.rawSqlExecution = {
        success: !sqlError,
        error: sqlError?.message,
        result: sqlResult
      };
      
      console.log('🔐 [RLS DEBUG] Raw SQL test result:', results.tests.rawSqlExecution);
    } catch (error) {
      results.tests.rawSqlExecution = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    console.log('🔐 [RLS DEBUG] ===== RLS Tests Complete =====');
    console.log('🔐 [RLS DEBUG] Full results:', results);
    
    return { success: true, results };
    
  } catch (error) {
    console.error('🔐 [RLS DEBUG] ===== RLS Test Failed =====', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const logDatabaseConnectionInfo = async () => {
  console.log('🔗 [DB DEBUG] ===== Database Connection Info =====');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    console.log('🔗 [DB DEBUG] Basic connection test:', {
      success: !error,
      error: error?.message,
      connectionWorking: !error
    });
    
    // Get session info
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log('🔗 [DB DEBUG] Session context:', {
      hasSession: !!session,
      userId: session?.user?.id,
      tokenPresent: !!session?.access_token,
      expiresAt: session?.expires_at,
      sessionAge: session ? Date.now() - new Date(session.expires_at || 0).getTime() + (session.expires_in || 0) * 1000 : null
    });
    
  } catch (error) {
    console.error('🔗 [DB DEBUG] Connection test failed:', error);
  }
};