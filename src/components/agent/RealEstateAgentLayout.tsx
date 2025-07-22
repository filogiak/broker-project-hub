
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { RealEstateAgentSidebar } from './RealEstateAgentSidebar';
import { RoleSwitcher } from '@/components/ui/role-switcher';

interface RealEstateAgentLayoutProps {
  children: React.ReactNode;
}

export function RealEstateAgentLayout({ children }: RealEstateAgentLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-light">
        <RealEstateAgentSidebar />
        <SidebarInset>
          <div className="p-6">
            <RoleSwitcher />
            <div className="mt-4">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
