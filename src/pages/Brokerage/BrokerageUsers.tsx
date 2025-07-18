
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import BrokerageSidebar from '@/components/brokerage/BrokerageSidebar';
import BrokerageUsersFullSection from '@/components/brokerage/BrokerageUsersFullSection';

const BrokerageUsers = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-light">
        <BrokerageSidebar />
        <SidebarInset>
          <BrokerageUsersFullSection />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BrokerageUsers;
