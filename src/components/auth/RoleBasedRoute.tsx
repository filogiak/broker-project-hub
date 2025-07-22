
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import AdminPermissionCheck from '@/components/admin/AdminPermissionCheck';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
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
  const { selectedRole } = useRoleSelection();

  if (loading) {
    return <LoadingOverlay message="Verifying permissions..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  console.log('🔒 [ROLE ROUTE] User:', user.email);
  console.log('🔒 [ROLE ROUTE] User roles:', user.roles);
  console.log('🔒 [ROLE ROUTE] Selected role:', selectedRole);
  console.log('🔒 [ROLE ROUTE] Allowed roles:', allowedRoles);

  // Check if user has any of the allowed roles
  const hasAnyAllowedRole = user.roles.some(role => allowedRoles.includes(role));
  
  if (!hasAnyAllowedRole) {
    console.log('🔒 [ROLE ROUTE] User does not have any allowed role, redirecting to:', fallbackPath);
    return <Navigate to={fallbackPath} replace />;
  }

  // If selectedRole is set and it's one of the allowed roles, we're good
  if (selectedRole && allowedRoles.includes(selectedRole)) {
    console.log('🔒 [ROLE ROUTE] Selected role matches allowed roles, granting access');
  } else {
    console.log('🔒 [ROLE ROUTE] Selected role does not match, but user has allowed role - continuing');
  }

  // Only use AdminPermissionCheck for superadmin routes
  if (allowedRoles.includes('superadmin') && allowedRoles.length === 1) {
    console.log('🔒 [ROLE ROUTE] Admin-only route, using AdminPermissionCheck');
    return (
      <AdminPermissionCheck fallback={<Navigate to={fallbackPath} replace />}>
        {children}
      </AdminPermissionCheck>
    );
  }

  // For all other cases, allow access
  console.log('🔒 [ROLE ROUTE] Access granted');
  return <>{children}</>;
};

export default RoleBasedRoute;
