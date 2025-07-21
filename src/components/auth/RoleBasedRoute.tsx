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

  console.log('RoleBasedRoute - User:', user.email);
  console.log('RoleBasedRoute - User roles:', user.roles);
  console.log('RoleBasedRoute - Selected role:', selectedRole);
  console.log('RoleBasedRoute - Allowed roles:', allowedRoles);

  // Determine the effective role to check against
  const effectiveRole = selectedRole || user.roles[0];
  console.log('RoleBasedRoute - Effective role:', effectiveRole);

  // Check if the effective role is in the allowed roles
  const hasAllowedRole = effectiveRole && allowedRoles.includes(effectiveRole);
  console.log('RoleBasedRoute - Has allowed role:', hasAllowedRole);

  // Fallback: check if user has any of the allowed roles (for backward compatibility)
  const hasAnyAllowedRole = user.roles.some(role => allowedRoles.includes(role));
  console.log('RoleBasedRoute - Has any allowed role:', hasAnyAllowedRole);

  // Use effective role check first, fallback to any allowed role check
  const canAccess = hasAllowedRole || hasAnyAllowedRole;

  if (!canAccess) {
    console.log('RoleBasedRoute - Access denied, redirecting to:', fallbackPath);
    return <Navigate to={fallbackPath} replace />;
  }

  // Only use AdminPermissionCheck if the effective role is superadmin AND superadmin is allowed
  const effectiveRoleIsSuperadmin = effectiveRole === 'superadmin';
  const superadminIsAllowed = allowedRoles.includes('superadmin');
  
  if (effectiveRoleIsSuperadmin && superadminIsAllowed) {
    console.log('RoleBasedRoute - Effective role is superadmin, using AdminPermissionCheck');
    return (
      <AdminPermissionCheck fallback={<Navigate to={fallbackPath} replace />}>
        {children}
      </AdminPermissionCheck>
    );
  }

  // For all other cases, allow access directly
  console.log('RoleBasedRoute - User has allowed role, granting access');
  return <>{children}</>;
};

export default RoleBasedRoute;
