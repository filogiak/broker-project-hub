
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, RefreshCw } from 'lucide-react';
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
  const { selectedRole, setSelectedRole, availableRoles, isMultiRole } = useRoleSelection();

  // Don't render if user has only one role
  if (!isMultiRole) {
    return null;
  }

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    // Show brief feedback
    const roleName = roleDisplayNames[newRole];
    console.log(`🔄 [ROLE SELECTOR] Switched to ${roleName}`);
  };

  const refreshDashboard = () => {
    window.location.reload();
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
              {availableRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  <div className="flex flex-col">
                    <span className="font-medium">{roleDisplayNames[role]}</span>
                    <span className="text-xs text-muted-foreground">{roleDescriptions[role]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge variant="secondary" className="ml-2">
            {availableRoles.length} role{availableRoles.length > 1 ? 's' : ''} available
          </Badge>
        </div>

        {selectedRole && (
          <div className="bg-muted/30 rounded-md p-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Current Context:</span> {roleDescriptions[selectedRole]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelector;
