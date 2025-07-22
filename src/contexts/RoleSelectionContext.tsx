
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
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

// Role priority order for multi-role users
const rolePriority: Record<UserRole, number> = {
  'superadmin': 1,
  'brokerage_owner': 2,
  'real_estate_agent': 3,
  'broker_assistant': 4,
  'simulation_collaborator': 5,
  'mortgage_applicant': 6,
};

// Route-to-role mapping
const getExpectedRoleFromPath = (pathname: string): UserRole | null => {
  if (pathname.startsWith('/agent/') || pathname === '/dashboard/real-estate-agent') {
    return 'real_estate_agent';
  }
  if (pathname.startsWith('/dashboard/broker-assistant')) {
    return 'broker_assistant';
  }
  if (pathname.startsWith('/dashboard/simulation-collaborator')) {
    return 'simulation_collaborator';
  }
  if (pathname.startsWith('/dashboard/mortgage-applicant')) {
    return 'mortgage_applicant';
  }
  if (pathname.startsWith('/brokerage/')) {
    return 'brokerage_owner';
  }
  if (pathname.startsWith('/admin')) {
    return 'superadmin';
  }
  return null;
};

export const RoleSelectionProvider = ({ children }: RoleSelectionProviderProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [selectedRole, setSelectedRoleState] = useState<UserRole | null>(null);
  const [rolesWithContext, setRolesWithContext] = useState<RoleWithContext[]>([]);

  const availableRoles = useMemo(() => user?.roles || [], [user?.roles]);
  const isMultiRole = useMemo(() => availableRoles.length > 1, [availableRoles.length]);

  // Fetch membership context for roles
  const refreshRoles = useCallback(async () => {
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
  }, [user?.id, availableRoles]);

  // Auto-sync role based on current route
  useEffect(() => {
    if (availableRoles.length === 0) return;

    const expectedRole = getExpectedRoleFromPath(location.pathname);
    
    console.log('🔄 [ROLE SYNC] Route changed:', location.pathname);
    console.log('🔄 [ROLE SYNC] Expected role for route:', expectedRole);
    console.log('🔄 [ROLE SYNC] Available roles:', availableRoles);
    console.log('🔄 [ROLE SYNC] Current selected role:', selectedRole);

    // If route expects a specific role and user has that role
    if (expectedRole && availableRoles.includes(expectedRole)) {
      console.log('🔄 [ROLE SYNC] Setting role based on route:', expectedRole);
      setSelectedRoleState(expectedRole);
      localStorage.setItem('selectedRole', expectedRole);
      return;
    }

    // If no route-specific role, use stored role or default
    if (!selectedRole) {
      const storedRole = localStorage.getItem('selectedRole') as UserRole | null;
      
      if (storedRole && availableRoles.includes(storedRole)) {
        console.log('🔄 [ROLE SYNC] Using stored role:', storedRole);
        setSelectedRoleState(storedRole);
      } else {
        // Find the highest priority role with active membership
        const activeRoles = rolesWithContext.filter(r => r.hasActiveMembership);
        let defaultRole: UserRole;
        
        if (activeRoles.length > 0) {
          // Sort by priority and pick the highest priority active role
          defaultRole = activeRoles.sort((a, b) => 
            rolePriority[a.role] - rolePriority[b.role]
          )[0].role;
        } else {
          // If no active memberships, use highest priority role available
          defaultRole = availableRoles.sort((a, b) => 
            rolePriority[a] - rolePriority[b]
          )[0];
        }
        
        console.log('🔄 [ROLE SYNC] Using default role:', defaultRole);
        setSelectedRoleState(defaultRole);
        localStorage.setItem('selectedRole', defaultRole);
      }
    }
  }, [location.pathname, availableRoles, rolesWithContext, selectedRole]);

  // Refresh roles when user changes
  useEffect(() => {
    refreshRoles();
  }, [refreshRoles]);

  const setSelectedRole = useCallback((role: UserRole) => {
    if (availableRoles.includes(role)) {
      console.log('🔄 [ROLE SELECTOR] Manual role change to:', role);
      setSelectedRoleState(role);
      localStorage.setItem('selectedRole', role);
    }
  }, [availableRoles]);

  const contextValue = useMemo(() => ({
    selectedRole,
    setSelectedRole,
    availableRoles,
    rolesWithContext,
    isMultiRole,
    refreshRoles,
  }), [selectedRole, setSelectedRole, availableRoles, rolesWithContext, isMultiRole, refreshRoles]);

  return (
    <RoleSelectionContext.Provider value={contextValue}>
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
