
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
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

const RoleSelector = () => {
  const { selectedRole, setSelectedRole, availableRoles, isMultiRole } = useRoleSelection();

  // Don't render if user has only one role
  if (!isMultiRole) {
    return null;
  }

  return (
    <div className="bg-white border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <User className="h-5 w-5 text-primary" />
        <h3 className="font-medium text-foreground">Select Your Role</h3>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Current Role:</span>
        <Select
          value={selectedRole || ''}
          onValueChange={(value) => setSelectedRole(value as UserRole)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {roleDisplayNames[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Badge variant="secondary" className="ml-2">
          {availableRoles.length} role{availableRoles.length > 1 ? 's' : ''} available
        </Badge>
      </div>
    </div>
  );
};

export default RoleSelector;
