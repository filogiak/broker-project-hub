
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminPermissionCheck from '@/components/admin/AdminPermissionCheck';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/dashboard' 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If superadmin is one of the allowed roles, use the AdminPermissionCheck
  if (allowedRoles.includes('superadmin')) {
    return (
      <AdminPermissionCheck fallback={<Navigate to={fallbackPath} replace />}>
        {children}
      </AdminPermissionCheck>
    );
  }

  // For other roles, check user.roles as before
  const hasAllowedRole = user.roles.some(role => allowedRoles.includes(role));

  if (!hasAllowedRole) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
