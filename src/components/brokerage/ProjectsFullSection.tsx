
import React, { useState } from 'react';
import { Plus, FolderOpen, Calendar, MoreVertical, Trash2, ExternalLink, User, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ProjectCreationWizard from './ProjectCreationWizard';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  });

  // Sort projects by creation date (most recent first)
  const sortedProjects = [...filteredProjects].sort((a, b) => 
    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
  );

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  };

  return (
    <div className="bg-white rounded-[12px] border-2 border-form-green p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold font-dm-sans text-black">
            Progetti Attivi
          </h2>
          <span className="text-sm font-normal text-muted-foreground">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'progetto' : 'progetti'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Search functionality */}
          <div className="flex items-center">
            {isSearchExpanded && (
              <div className="flex items-center mr-2">
                <Input
                  placeholder="Cerca progetti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 h-10"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSearchToggle}
                  className="ml-1 p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!isSearchExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchToggle}
                className="mr-2 p-2"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="gomutuo-button-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuovo Progetto
          </Button>
        </div>
      </div>

      {/* Projects List */}
      {sortedProjects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4 font-dm-sans">
            {searchQuery ? 'Nessun progetto trovato per la ricerca.' : 'Nessun progetto trovato.'}
          </p>
          {!searchQuery && (
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="gomutuo-button-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crea Primo Progetto
            </Button>
          )}
        </div>
      ) : (
        sortedProjects.map((project) => (
          <Card 
            key={project.id} 
            className="cursor-pointer bg-white border-2 border-form-green rounded-[12px] press-down-effect relative overflow-hidden mb-4"
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
                    <p className="font-medium text-form-green text-sm">
                      {project.status === 'active' ? 'Attivo' : 
                       project.status === 'completed' ? 'Completato' : 
                       project.status === 'pending_approval' ? 'In attesa' : project.status}
                    </p>
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
        ))
      )}

      {/* Create Project Wizard */}
      <ProjectCreationWizard
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};

export default ProjectsFullSection;
