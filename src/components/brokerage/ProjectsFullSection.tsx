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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ProjectCreationWizard from './ProjectCreationWizard';
import type { Database } from '@/integrations/supabase/types';
import { getApplicantDisplayNames } from '@/utils/applicantHelpers';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

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

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      await onDeleteProject(projectToDelete);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Get applicant names for search
    const { primaryApplicant, secondaryApplicant } = getApplicantDisplayNames(project);
    
    return (
      project.name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      primaryApplicant?.toLowerCase().includes(query) ||
      (secondaryApplicant && secondaryApplicant.toLowerCase().includes(query))
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
    <div className="flex-1 p-8">
      <div className="bg-white rounded-[12px] shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center justify-between font-dm-sans text-black text-2xl font-semibold">
              Progetti Attivi
              <span className="text-sm font-normal text-muted-foreground ml-4">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'progetto' : 'progetti'}
              </span>
            </h2>
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
            </div>
          ) : (
            <div className="space-y-4">
              {sortedProjects.map((project) => {
                const { primaryApplicant, secondaryApplicant } = getApplicantDisplayNames(project);
                
                return (
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
                            <h3 className="font-semibold text-black font-dm-sans text-lg">
                              {project.name}
                            </h3>
                          </div>

                          <div className="text-left">
                            <p className="text-xs text-gray-500 mb-1">Richiedente</p>
                            <p className="font-medium text-form-green text-sm">
                              {primaryApplicant}
                            </p>
                          </div>

                          <div className="text-left">
                            <p className="text-xs text-gray-500 mb-1">Richiedente 2</p>
                            <p className="font-medium text-form-green text-sm">
                              {secondaryApplicant || '-'}
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
                                onClick={() => handleDeleteClick(project.id)}
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
                );
              })}
            </div>
          )}

          {/* Create Project Wizard */}
          <ProjectCreationWizard
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreateProject={handleCreateProject}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
                <AlertDialogDescription>
                  Sei sicuro di voler eliminare questo progetto? Questa azione non può essere annullata.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                  Annulla
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default ProjectsFullSection;
