
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

const roleDisplayNames: Record<UserRole, string> = {
  superadmin: 'Super Admin',
  brokerage_owner: 'Brokerage Owner',
  broker_assistant: 'Broker Assistant',
  mortgage_applicant: 'Mortgage Applicant',
  real_estate_agent: 'Real Estate Agent',
  simulation_collaborator: 'Simulation Collaborator',
};

const roleDescriptions: Record<UserRole, string> = {
  superadmin: 'Full system administration access',
  brokerage_owner: 'Manage your brokerage and projects',
  broker_assistant: 'Support brokerage operations',
  mortgage_applicant: 'Access your mortgage applications',
  real_estate_agent: 'Manage client transactions',
  simulation_collaborator: 'Work on mortgage simulations',
};

const RoleSelector = () => {
  const { selectedRole, setSelectedRole, isMultiRole, rolesWithContext, refreshRoles } = useRoleSelection();

  // Don't render if user has only one role
  if (!isMultiRole) {
    return null;
  }

  // Filter roles to show active ones first, inactive ones with warning
  const activeRoles = rolesWithContext.filter(r => r.hasActiveMembership);
  const inactiveRoles = rolesWithContext.filter(r => !r.hasActiveMembership);

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    const roleName = roleDisplayNames[newRole];
    console.log(`🔄 [ROLE SELECTOR] Switched to ${roleName}`);
  };

  const refreshDashboard = () => {
    refreshRoles();
    // Add a small delay to ensure roles are refreshed before reloading
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="bg-white border border-border rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Role Context</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={refreshDashboard}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground min-w-[100px]">Active Role:</span>
          <Select
            value={selectedRole || ''}
            onValueChange={(value) => handleRoleChange(value as UserRole)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {/* Active roles first */}
              {activeRoles.length > 0 && (
                <>
                  {activeRoles.map((roleInfo) => (
                    <SelectItem key={roleInfo.role} value={roleInfo.role}>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <div className="flex flex-col">
                          <span className="font-medium">{roleDisplayNames[roleInfo.role]}</span>
                          <span className="text-xs text-muted-foreground">
                            {roleDescriptions[roleInfo.role]} • {roleInfo.membershipCount} membership{roleInfo.membershipCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  {inactiveRoles.length > 0 && (
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t">
                      Inactive Roles (No Memberships)
                    </div>
                  )}
                </>
              )}
              
              {/* Inactive roles with warning */}
              {inactiveRoles.map((roleInfo) => (
                <SelectItem key={roleInfo.role} value={roleInfo.role} className="opacity-60">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">{roleDisplayNames[roleInfo.role]}</span>
                      <span className="text-xs text-muted-foreground">
                        No active memberships - Role may be removed
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge variant="secondary" className="ml-2">
            {activeRoles.length} active, {inactiveRoles.length} inactive
          </Badge>
        </div>

        {selectedRole && (
          <div className="bg-muted/30 rounded-md p-3">
            <div className="flex items-start gap-2">
              {rolesWithContext.find(r => r.role === selectedRole)?.hasActiveMembership ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Current Context:</span> {roleDescriptions[selectedRole]}
                </p>
                {!rolesWithContext.find(r => r.role === selectedRole)?.hasActiveMembership && (
                  <p className="text-xs text-amber-700 mt-1">
                    ⚠️ This role has no active memberships and may be cleaned up automatically.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {inactiveRoles.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Notice:</span> Some roles have no active memberships and may be automatically removed.
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  To keep these roles, join a brokerage, project, or simulation that uses them.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelector;
