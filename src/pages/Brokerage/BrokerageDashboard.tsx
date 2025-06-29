
import React from 'react';
import DashboardStats from '@/components/brokerage/DashboardStats';
import ProjectsOverview from '@/components/brokerage/ProjectsOverview';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary font-dm-sans">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1 font-dm-sans">
            Monitor your brokerage performance and key metrics
          </p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats brokerageId={brokerage.id} projects={projects} />

      {/* Projects Overview - Shows only 2 recent projects */}
      <ProjectsOverview 
        projects={projects}
        brokerageId={brokerage.id}
        onOpenProject={onOpenProject}
      />
    </div>
  );
};

export default BrokerageDashboard;
