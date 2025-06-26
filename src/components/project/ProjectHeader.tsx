
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, Users, Calendar } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectHeaderProps {
  project: Project;
  onBackToBrokerage: () => void;
}

const ProjectHeader = ({ project, onBackToBrokerage }: ProjectHeaderProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-vibe-green-vivid text-white border-vibe-green-vivid';
      case 'pending_approval':
        return 'bg-accent-yellow text-form-green border-accent-yellow';
      default:
        return 'bg-gray-200 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white border-b border-form-border">
      <div className="px-6 py-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBackToBrokerage}
            className="p-0 h-auto hover:text-form-green"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Brokerage Dashboard
          </Button>
          <span>/</span>
          <span className="text-form-green font-medium">Project Dashboard</span>
        </div>

        {/* Project Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-form-green font-dm-sans">{project.name}</h1>
              <Badge className={`${getStatusColor(project.status)} font-medium`}>
                {project.status === 'active' ? 'Active' : 
                 project.status === 'pending_approval' ? 'Pending' : 
                 project.status}
              </Badge>
            </div>
            
            {project.description && (
              <p className="text-lg text-gray-600 font-inter mb-4">{project.description}</p>
            )}
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              {project.project_type && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-form-green rounded-full" />
                  <span className="capitalize">{project.project_type.replace('_', ' ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
