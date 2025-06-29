
import React from 'react';
import BrokerageHeaderCard from '@/components/brokerage/BrokerageHeaderCard';
import DashboardStats from '@/components/brokerage/DashboardStats';
import ProjectsOverview from '@/components/brokerage/ProjectsOverview';
import BrokerageQuickActions from '@/components/brokerage/BrokerageQuickActions';
import RecentActivity from '@/components/project/RecentActivity';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface BrokerageDashboardProps {
  brokerage: Brokerage;
  projects: Project[];
  onCreateProject: (projectData: any) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onOpenProject: (projectId: string) => void;
}

const BrokerageDashboard = ({ 
  brokerage, 
  projects, 
  onCreateProject, 
  onDeleteProject, 
  onOpenProject 
}: BrokerageDashboardProps) => {
  return (
    <div className="flex-1 p-8 space-y-8">
      {/* Enhanced Brokerage Header with Status */}
      <BrokerageHeaderCard 
        brokerageName={brokerage.name} 
        brokerageDescription={brokerage.description || undefined} 
        lastActivity="2h" 
        isActive={true} 
      />

      {/* Main Action Cards */}
      <div>
        <h2 className="font-semibold font-dm-sans mb-6 text-2xl text-black">Azioni Principali</h2>
        <DashboardStats brokerageId={brokerage.id} projects={projects} />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity />
        <BrokerageQuickActions />
      </div>
    </div>
  );
};

export default BrokerageDashboard;
