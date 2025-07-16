
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="gomutuo-card-form mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between font-dm-sans text-lg text-[hsl(var(--form-green))]">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5" />
            Role Context
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshDashboard}
            className="h-8 w-8 p-0 hover:bg-[hsl(var(--vibe-green-light))]"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground font-dm-sans min-w-[100px]">
            Active Role:
          </span>
          <div className="flex items-center gap-3 flex-1">
            <Select
              value={selectedRole || ''}
              onValueChange={(value) => handleRoleChange(value as UserRole)}
            >
              <SelectTrigger className="gomutuo-form-input h-auto py-2 flex-1 max-w-sm">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="z-50">
                {/* Active roles first */}
                {activeRoles.length > 0 && (
                  <>
                    {activeRoles.map((roleInfo) => (
                      <SelectItem key={roleInfo.role} value={roleInfo.role} className="py-3">
                        <div className="flex items-center gap-3 w-full">
                          <CheckCircle className="h-4 w-4 text-[hsl(var(--form-green))] flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium font-dm-sans text-sm">
                              {roleDisplayNames[roleInfo.role]}
                            </span>
                            <span className="text-xs text-muted-foreground font-dm-sans">
                              {roleDescriptions[roleInfo.role]} • {roleInfo.membershipCount} membership{roleInfo.membershipCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {inactiveRoles.length > 0 && (
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-t font-dm-sans">
                        Inactive Roles (No Memberships)
                      </div>
                    )}
                  </>
                )}
                
                {/* Inactive roles with warning */}
                {inactiveRoles.map((roleInfo) => (
                  <SelectItem key={roleInfo.role} value={roleInfo.role} className="py-3 opacity-60">
                    <div className="flex items-center gap-3 w-full">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium font-dm-sans text-sm">
                          {roleDisplayNames[roleInfo.role]}
                        </span>
                        <span className="text-xs text-muted-foreground font-dm-sans">
                          No active memberships - Role may be removed
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Badge 
              variant="secondary" 
              className="gomutuo-selection-tag whitespace-nowrap"
            >
              {activeRoles.length} active, {inactiveRoles.length} inactive
            </Badge>
          </div>
        </div>

        {selectedRole && (
          <div className="bg-[hsl(var(--form-beige))] rounded-[10px] border border-[hsl(var(--form-border))] p-4">
            <div className="flex items-start gap-3">
              {rolesWithContext.find(r => r.role === selectedRole)?.hasActiveMembership ? (
                <CheckCircle className="h-5 w-5 text-[hsl(var(--form-green))] mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground font-dm-sans">
                  <span className="font-medium text-[hsl(var(--form-green))]">Current Context:</span> {roleDescriptions[selectedRole]}
                </p>
                {!rolesWithContext.find(r => r.role === selectedRole)?.hasActiveMembership && (
                  <p className="text-xs text-amber-700 mt-1 font-dm-sans">
                    ⚠️ This role has no active memberships and may be cleaned up automatically.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {inactiveRoles.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-amber-800 font-dm-sans">
                  <span className="font-medium">Notice:</span> Some roles have no active memberships and may be automatically removed.
                </p>
                <p className="text-xs text-amber-700 mt-1 font-dm-sans">
                  To keep these roles, join a brokerage, project, or simulation that uses them.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleSelector;
