
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface RoleWithContext {
  role: UserRole;
  hasActiveMembership: boolean;
  membershipCount: number;
}

interface RoleSelectionContextType {
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole) => void;
  availableRoles: UserRole[];
  rolesWithContext: RoleWithContext[];
  isMultiRole: boolean;
  refreshRoles: () => Promise<void>;
}

const RoleSelectionContext = createContext<RoleSelectionContextType | undefined>(undefined);

interface RoleSelectionProviderProps {
  children: ReactNode;
}

export const RoleSelectionProvider = ({ children }: RoleSelectionProviderProps) => {
  const { user } = useAuth();
  const [selectedRole, setSelectedRoleState] = useState<UserRole | null>(null);
  const [rolesWithContext, setRolesWithContext] = useState<RoleWithContext[]>([]);

  const availableRoles = user?.roles || [];
  const isMultiRole = availableRoles.length > 1;

  // Fetch membership context for roles
  const refreshRoles = async () => {
    if (!user?.id || availableRoles.length === 0) {
      setRolesWithContext([]);
      return;
    }

    try {
      const rolesWithMemberships = await Promise.all(
        availableRoles.map(async (role) => {
          let membershipCount = 0;
          let hasActiveMembership = false;

          // Check memberships based on role type
          switch (role) {
            case 'superadmin':
            case 'brokerage_owner':
              // These are permanent roles
              hasActiveMembership = true;
              membershipCount = 1;
              break;

            case 'simulation_collaborator':
              // Check brokerage and simulation memberships
              const [brokerageResult, simulationResult] = await Promise.all([
                supabase
                  .from('brokerage_members')
                  .select('id', { count: 'exact' })
                  .eq('user_id', user.id),
                supabase
                  .from('simulation_members')
                  .select('id', { count: 'exact' })
                  .eq('user_id', user.id)
              ]);
              
              membershipCount = (brokerageResult.count || 0) + (simulationResult.count || 0);
              hasActiveMembership = membershipCount > 0;
              break;

            case 'broker_assistant':
            case 'real_estate_agent':
              // Check brokerage and project memberships
              const [brokerageAssistantResult, projectAssistantResult] = await Promise.all([
                supabase
                  .from('brokerage_members')
                  .select('id', { count: 'exact' })
                  .eq('user_id', user.id),
                supabase
                  .from('project_members')
                  .select('id', { count: 'exact' })
                  .eq('user_id', user.id)
              ]);
              
              membershipCount = (brokerageAssistantResult.count || 0) + (projectAssistantResult.count || 0);
              hasActiveMembership = membershipCount > 0;
              break;

            case 'mortgage_applicant':
              // Check project memberships
              const projectResult = await supabase
                .from('project_members')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id);
              
              membershipCount = projectResult.count || 0;
              hasActiveMembership = membershipCount > 0;
              break;

            default:
              // Unknown role, assume active to be safe
              hasActiveMembership = true;
              membershipCount = 1;
          }

          return {
            role,
            hasActiveMembership,
            membershipCount,
          };
        })
      );

      setRolesWithContext(rolesWithMemberships);
    } catch (error) {
      console.error('Error fetching role memberships:', error);
      // Fallback: mark all roles as having active memberships
      setRolesWithContext(
        availableRoles.map(role => ({
          role,
          hasActiveMembership: true,
          membershipCount: 1,
        }))
      );
    }
  };

  // Initialize selected role from localStorage or default to first role with active membership
  useEffect(() => {
    if (availableRoles.length > 0) {
      const storedRole = localStorage.getItem('selectedRole') as UserRole | null;
      
      if (storedRole && availableRoles.includes(storedRole)) {
        setSelectedRoleState(storedRole);
      } else {
        // Find first role with active membership, or first role if none have memberships
        const roleWithMembership = rolesWithContext.find(r => r.hasActiveMembership);
        const defaultRole = roleWithMembership?.role || availableRoles[0];
        setSelectedRoleState(defaultRole);
      }
    }
  }, [availableRoles, rolesWithContext]);

  // Refresh roles when user changes
  useEffect(() => {
    refreshRoles();
  }, [user?.id, availableRoles]);

  const setSelectedRole = (role: UserRole) => {
    if (availableRoles.includes(role)) {
      setSelectedRoleState(role);
      localStorage.setItem('selectedRole', role);
    }
  };

  return (
    <RoleSelectionContext.Provider
      value={{
        selectedRole,
        setSelectedRole,
        availableRoles,
        rolesWithContext,
        isMultiRole,
        refreshRoles,
      }}
    >
      {children}
    </RoleSelectionContext.Provider>
  );
};

export const useRoleSelection = () => {
  const context = useContext(RoleSelectionContext);
  if (context === undefined) {
    throw new Error('useRoleSelection must be used within a RoleSelectionProvider');
  }
  return context;
};
