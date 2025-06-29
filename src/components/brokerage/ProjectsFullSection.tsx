
import React, { useState } from 'react';
import { Plus, FolderOpen, Users, Calendar, MoreVertical, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreateProjectModal from './CreateProjectModal';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectsFullSectionProps {
  projects: Project[];
  brokerageId: string;
  onCreateProject: (projectData: any) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onOpenProject: (projectId: string) => void;
}

const ProjectsFullSection = ({ 
  projects, 
  brokerageId, 
  onCreateProject, 
  onDeleteProject, 
  onOpenProject 
}: ProjectsFullSectionProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleCreateProject = async (projectData: any) => {
    await onCreateProject(projectData);
    setIsCreateModalOpen(false);
  };

  // Sort projects by creation date (most recent first)
  const sortedProjects = [...projects].sort((a, b) => 
    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );

  return (
    <div className="gomutuo-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-form-green font-dm-sans flex items-center gap-2">
            <FolderOpen className="h-6 w-6" />
            Gestione Progetti
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-dm-sans">
            Gestisci tutti i progetti del mutuo per la tua agenzia
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-accent-yellow text-form-green border-accent-yellow hover:bg-accent-yellow-alt font-dm-sans">
            {projects.length} progetti
          </Badge>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-form-green text-white hover:bg-form-green-hover flex items-center gap-2 font-dm-sans font-medium"
          >
            <Plus className="h-4 w-4" />
            Nuovo Progetto
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        {sortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-form-green mb-2 font-dm-sans">
              Nessun progetto ancora
            </h3>
            <p className="text-muted-foreground mb-6 font-dm-sans">
              Crea il tuo primo progetto per iniziare a gestire i mutui
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-form-green text-white hover:bg-form-green-hover flex items-center gap-2 font-dm-sans font-medium"
            >
              <Plus className="h-4 w-4" />
              Crea Primo Progetto
            </Button>
          </div>
        ) : (
          sortedProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-form-green rounded-lg p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-form-green font-dm-sans">
                      {project.name}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-vibe-green-light text-form-green border-form-green"
                    >
                      {project.status === 'active' ? 'Attivo' : 
                       project.status === 'completed' ? 'Completato' : 
                       project.status === 'pending_approval' ? 'In attesa' : project.status}
                    </Badge>
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-3 font-dm-sans">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className="font-dm-sans">
                        Creato il {formatDate(project.created_at)}
                      </span>
                    </div>
                    {project.project_type && (
                      <div className="flex items-center gap-1">
                        <span className="font-dm-sans capitalize">
                          {project.project_type.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenProject(project.id)}
                    className="flex items-center gap-1 font-dm-sans"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Apri
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="p-2">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onDeleteProject(project.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
        brokerageId={brokerageId}
      />
    </div>
  );
};

export default ProjectsFullSection;
