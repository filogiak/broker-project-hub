
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export function RoleSwitcher() {
  const { selectedRole, setSelectedRole, isMultiRole, availableRoles } = useRoleSelection();
  const navigate = useNavigate();

  // Don't render if user has only one role
  if (!isMultiRole) {
    return null;
  }

  const handleRoleChange = (newRole: UserRole) => {
    console.log('🔄 [ROLE SWITCHER] Switching to role:', newRole);
    
    // Set the role and navigate to dashboard to trigger routing
    setSelectedRole(newRole);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="w-full">
      <Select
        value={selectedRole || ''}
        onValueChange={(value) => handleRoleChange(value as UserRole)}
      >
        <SelectTrigger className="gomutuo-form-input h-auto py-2 w-full text-xs">
          <SelectValue placeholder="Seleziona un ruolo" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-white border border-form-border shadow-lg min-w-[200px]">
          {availableRoles.map((role) => (
            <SelectItem key={role} value={role} className="py-2 px-3">
              <span className="font-medium font-dm-sans text-xs text-gray-900">
                {roleDisplayNames[role]}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
