import React, { ReactNode } from 'react';
import { RoleSelectionProvider } from '@/contexts/RoleSelectionContext';

interface RoleAwareLayoutProps {
  children: ReactNode;
}

export const RoleAwareLayout = ({ children }: RoleAwareLayoutProps) => {
  return (
    <RoleSelectionProvider>
      {children}
    </RoleSelectionProvider>
  );
};