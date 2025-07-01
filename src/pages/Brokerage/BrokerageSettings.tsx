
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import BrokerageSidebar from '@/components/brokerage/BrokerageSidebar';
import PersonalProfileSection from '@/components/brokerage/PersonalProfileSection';
import OrganizationSection from '@/components/brokerage/OrganizationSection';

const BrokerageSettings = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <BrokerageSidebar />
        <SidebarInset>
          <div className="flex-1 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PersonalProfileSection />
              <OrganizationSection />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BrokerageSettings;
