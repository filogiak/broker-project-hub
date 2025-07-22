
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { RealEstateAgentSidebar } from './RealEstateAgentSidebar';


interface RealEstateAgentLayoutProps {
  children: React.ReactNode;
}

export function RealEstateAgentLayout({ children }: RealEstateAgentLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-light">
        <RealEstateAgentSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
