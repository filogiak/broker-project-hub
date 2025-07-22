
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { BrokerAssistantSidebar } from './BrokerAssistantSidebar';
import { RoleSwitcher } from '@/components/ui/role-switcher';

interface BrokerAssistantLayoutProps {
  children: React.ReactNode;
}

export function BrokerAssistantLayout({ children }: BrokerAssistantLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-light">
        <BrokerAssistantSidebar />
        <SidebarInset>
          <div className="p-4">
            <RoleSwitcher />
          </div>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
