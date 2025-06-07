
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

  console.log('RoleBasedRoute - User:', user.email);
  console.log('RoleBasedRoute - User roles:', user.roles);
  console.log('RoleBasedRoute - Allowed roles:', allowedRoles);

  // Check if user has any of the allowed roles
  const hasAllowedRole = user.roles.some(role => allowedRoles.includes(role));
  console.log('RoleBasedRoute - Has allowed role:', hasAllowedRole);

  if (!hasAllowedRole) {
    console.log('RoleBasedRoute - Access denied, redirecting to:', fallbackPath);
    return <Navigate to={fallbackPath} replace />;
  }

  // Only use AdminPermissionCheck if the user is actually a superadmin AND superadmin is allowed
  const userIsSuperadmin = user.roles.includes('superadmin');
  const superadminIsAllowed = allowedRoles.includes('superadmin');
  
  if (userIsSuperadmin && superadminIsAllowed) {
    console.log('RoleBasedRoute - User is superadmin, using AdminPermissionCheck');
    return (
      <AdminPermissionCheck fallback={<Navigate to={fallbackPath} replace />}>
        {children}
      </AdminPermissionCheck>
    );
  }

  // For all other cases (including brokerage_owner), allow access directly
  console.log('RoleBasedRoute - User has allowed role, granting access');
  return <>{children}</>;
};

export default RoleBasedRoute;
