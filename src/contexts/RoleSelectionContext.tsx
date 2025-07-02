
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface RoleSelectionContextType {
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole) => void;
  availableRoles: UserRole[];
  isMultiRole: boolean;
}

const RoleSelectionContext = createContext<RoleSelectionContextType | undefined>(undefined);

interface RoleSelectionProviderProps {
  children: ReactNode;
}

export const RoleSelectionProvider = ({ children }: RoleSelectionProviderProps) => {
  const { user } = useAuth();
  const [selectedRole, setSelectedRoleState] = useState<UserRole | null>(null);

  const availableRoles = user?.roles || [];
  const isMultiRole = availableRoles.length > 1;

  // Initialize selected role from localStorage or default to first role
  useEffect(() => {
    if (availableRoles.length > 0) {
      const storedRole = localStorage.getItem('selectedRole') as UserRole | null;
      
      if (storedRole && availableRoles.includes(storedRole)) {
        setSelectedRoleState(storedRole);
      } else {
        setSelectedRoleState(availableRoles[0]);
      }
    }
  }, [availableRoles]);

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
        isMultiRole,
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
