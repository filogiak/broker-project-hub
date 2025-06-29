
import React from 'react';
import { Plus, FolderOpen, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectsOverviewProps {
  projects: Project[];
  brokerageId: string;
  onOpenProject: (projectId: string) => void;
}

const ProjectsOverview = ({ projects, brokerageId, onOpenProject }: ProjectsOverviewProps) => {
  const navigate = useNavigate();
  
  // Sort projects by creation date and take only the 2 most recent
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 2);

  const handleViewAll = () => {
    navigate(`/brokerage/${brokerageId}/projects`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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
            Gestisci progetti, monitora il progresso del team
          </p>
        </div>
        <Badge className="bg-accent-yellow text-form-green border-accent-yellow hover:bg-accent-yellow-alt font-dm-sans">
          {projects.length} progetti
        </Badge>
      </div>

      {/* Recent Projects */}
      <div className="space-y-4 mb-6">
        {recentProjects.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-dm-sans">Nessun progetto trovato</p>
            <p className="text-sm text-muted-foreground font-dm-sans">
              Crea il tuo primo progetto per iniziare
            </p>
          </div>
        ) : (
          recentProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-form-green rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => onOpenProject(project.id)}
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
              </div>
            </div>
          ))
        )}
      </div>

      {/* View All Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleViewAll}
          className="bg-form-green text-white hover:bg-form-green-hover px-6 py-2 font-dm-sans font-medium"
        >
          Vedi tutti
        </Button>
      </div>
    </div>
  );
};

export default ProjectsOverview;
