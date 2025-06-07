
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield } from 'lucide-react';

interface AdminPermissionCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AdminPermissionCheck = ({ children, fallback }: AdminPermissionCheckProps) => {
  const { user, loading } = useAuth();
  const [isSuperadmin, setIsSuperadmin] = useState<boolean | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);

  useEffect(() => {
    const checkSuperadminRole = async () => {
      if (!user) {
        setIsSuperadmin(false);
        setPermissionLoading(false);
        return;
      }

      try {
        console.log('Checking superadmin role for user:', user.email);
        const { data: isAdmin, error } = await supabase.rpc('is_superadmin');
        
        if (error) {
          console.error('Error checking superadmin role:', error);
          setIsSuperadmin(false);
        } else {
          console.log('Superadmin check result:', isAdmin);
          setIsSuperadmin(isAdmin || false);
        }
      } catch (error) {
        console.error('Failed to check superadmin role:', error);
        setIsSuperadmin(false);
      } finally {
        setPermissionLoading(false);
      }
    };

    checkSuperadminRole();
  }, [user]);

  if (loading || permissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading permissions...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              You must be logged in to access this area.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isSuperadmin) {
    const defaultFallback = (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Insufficient Permissions
            </CardTitle>
            <CardDescription>
              You need superadmin privileges to access this area. Current user: {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact your system administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );

    return fallback || defaultFallback;
  }

  return <>{children}</>;
};

export default AdminPermissionCheck;
