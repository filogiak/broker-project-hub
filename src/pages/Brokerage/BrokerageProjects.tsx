
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import BrokerageSidebar from '@/components/brokerage/BrokerageSidebar';
import ProjectsFullSection from '@/components/brokerage/ProjectsFullSection';

const BrokerageProjects = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <BrokerageSidebar />
        <SidebarInset>
          <ProjectsFullSection />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BrokerageProjects;
