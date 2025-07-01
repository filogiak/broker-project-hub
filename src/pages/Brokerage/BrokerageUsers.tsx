
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import BrokerageSidebar from '@/components/brokerage/BrokerageSidebar';
import BrokerageUsersSection from '@/components/brokerage/BrokerageUsersSection';

const BrokerageUsers = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <BrokerageSidebar />
        <SidebarInset>
          <BrokerageUsersSection />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BrokerageUsers;
