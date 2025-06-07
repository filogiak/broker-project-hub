
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Calendar } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectsSectionProps {
  projects: Project[];
  brokerageId: string;
  onCreateProject: () => void;
}

const ProjectsSection = ({ projects, brokerageId, onCreateProject }: ProjectsSectionProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="card-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Projects
            </CardTitle>
            <CardDescription>
              Manage mortgage projects and invite team members
            </CardDescription>
          </div>
          <Button onClick={onCreateProject} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to start managing mortgage applications
            </p>
            <Button onClick={onCreateProject}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 border border-form-border rounded-lg bg-form-beige hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{project.name}</h4>
                    {project.description && (
                      <p className="text-muted-foreground text-sm mt-1">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created: {formatDate(project.created_at)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'active' 
                          ? 'bg-accent-yellow text-primary' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Team
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsSection;
