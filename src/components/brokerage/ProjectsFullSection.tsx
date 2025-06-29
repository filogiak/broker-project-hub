
import React, { useState, useMemo } from 'react';
import { Plus, FolderOpen, Calendar, MoreVertical, Trash2, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return filtered.sort((a, b) => 
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );
  }, [projects, searchTerm]);

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary font-dm-sans">Progetti Attivi</h1>
          <p className="text-muted-foreground mt-1 font-dm-sans">
            Gestisci e monitora tutti i tuoi progetti attivi
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="gomutuo-button-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuovo Progetto
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca progetti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Projects Count */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground font-dm-sans">
            {filteredAndSortedProjects.length} {filteredAndSortedProjects.length === 1 ? 'progetto trovato' : 'progetti trovati'}
          </span>
          {searchTerm && (
            <Badge variant="outline" className="text-xs">
              Ricerca: "{searchTerm}"
            </Badge>
          )}
        </div>
      </div>

      {/* Projects List */}
      {filteredAndSortedProjects.length === 0 ? (
        <div className="text-center py-12">
          {searchTerm ? (
            <>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2 font-dm-sans">
                Nessun progetto trovato per "{searchTerm}"
              </p>
              <p className="text-sm text-muted-foreground font-dm-sans">
                Prova a modificare i termini di ricerca
              </p>
            </>
          ) : (
            <>
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4 font-dm-sans">Nessun progetto trovato.</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="gomutuo-button-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Crea Primo Progetto
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedProjects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer bg-white border-2 border-form-green rounded-[12px] press-down-effect relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-form-green rounded-b-[10px]"></div>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="h-9 w-9 text-form-green" />
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <h3 className="font-semibold text-black font-dm-sans text-lg mb-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 font-dm-sans">
                        {project.description || 'Nessuna descrizione'}
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-xs text-gray-500 mb-1">Stato</p>
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-vibe-green-light text-form-green border-form-green"
                      >
                        {project.status === 'active' ? 'Attivo' : 
                         project.status === 'completed' ? 'Completato' : 
                         project.status === 'pending_approval' ? 'In attesa' : project.status}
                      </Badge>
                    </div>

                    <div className="text-left">
                      <p className="text-xs text-gray-500 mb-1">Tipo Progetto</p>
                      <p className="font-medium text-form-green text-sm">
                        {project.project_type ? project.project_type.replace('_', ' ') : 'Non specificato'}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Data Creazione</p>
                      <p className="font-medium text-form-green text-sm">{formatDate(project.created_at)}</p>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};

export default ProjectsFullSection;
