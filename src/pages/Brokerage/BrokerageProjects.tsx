
import React from 'react';
import ProjectsFullSection from '@/components/brokerage/ProjectsFullSection';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface BrokerageProjectsProps {
  brokerage: Brokerage;
  projects: Project[];
  onCreateProject: (projectData: any) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onOpenProject: (projectId: string) => void;
}

const BrokerageProjects = ({
  brokerage,
  projects,
  onCreateProject,
  onDeleteProject,
  onOpenProject
}: BrokerageProjectsProps) => {
  return (
    <div className="flex-1 p-8">
      {/* Projects Full Section - Shows all projects with New Project button */}
      <ProjectsFullSection 
        projects={projects} 
        brokerageId={brokerage.id} 
        onCreateProject={onCreateProject} 
        onDeleteProject={onDeleteProject} 
        onOpenProject={onOpenProject} 
      />
    </div>
  );
};

export default BrokerageProjects;
