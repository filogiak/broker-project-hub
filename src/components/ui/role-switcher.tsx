
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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

const roleDashboardPaths: Record<UserRole, string> = {
  superadmin: '/admin',
  brokerage_owner: '/dashboard', // Will redirect to brokerage
  broker_assistant: '/dashboard/broker-assistant',
  mortgage_applicant: '/dashboard/mortgage-applicant',
  real_estate_agent: '/agent/dashboard',
  simulation_collaborator: '/dashboard/simulation-collaborator',
};

export function RoleSwitcher() {
  const { selectedRole, setSelectedRole, isMultiRole, availableRoles } = useRoleSelection();
  const navigate = useNavigate();

  // Don't render if user has only one role
  if (!isMultiRole) {
    return null;
  }

  const handleRoleChange = (newRole: UserRole) => {
    console.log('🔄 [ROLE SWITCHER] Switching to role:', newRole);
    setSelectedRole(newRole);
    
    // Navigate to the appropriate dashboard for the selected role
    const dashboardPath = roleDashboardPaths[newRole];
    if (dashboardPath) {
      navigate(dashboardPath);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-vibe-green-light rounded-lg border border-form-green/20">
      <span className="text-sm font-medium text-form-green font-dm-sans min-w-[60px]">
        Role:
      </span>
      <div className="flex items-center gap-2 flex-1">
        <Select
          value={selectedRole || ''}
          onValueChange={(value) => handleRoleChange(value as UserRole)}
        >
          <SelectTrigger className="gomutuo-form-input h-auto py-2 flex-1 max-w-sm">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent className="z-50">
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role} className="py-2">
                <span className="font-medium font-dm-sans text-sm">
                  {roleDisplayNames[role]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Badge 
          variant="secondary" 
          className="gomutuo-selection-tag whitespace-nowrap"
        >
          {availableRoles.length} roles
        </Badge>
      </div>
    </div>
  );
}
