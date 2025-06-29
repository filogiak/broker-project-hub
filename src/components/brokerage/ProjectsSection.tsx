
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Users, Calendar, Trash2, ExternalLink, Building2, Shield } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import BrokerageActionCard from './BrokerageActionCard';
import ProjectCreationWizard from './ProjectCreationWizard';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectType = Database['public']['Enums']['project_type'];
type ApplicantCount = Database['public']['Enums']['applicant_count'];

interface ProjectData {
  name: string;
  description: string;
  projectType: ProjectType | null;
  applicantCount: ApplicantCount;
  hasGuarantor: boolean;
}

interface ProjectsSectionProps {
  projects: Project[];
  brokerageId: string;
  onCreateProject: (projectData: ProjectData) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onOpenProject: (projectId: string) => void;
}

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  first_home_purchase: 'First Home Purchase',
  refinance: 'Refinance',
  investment_property: 'Investment Property',
  construction_loan: 'Construction Loan',
  home_equity_loan: 'Home Equity Loan',
  reverse_mortgage: 'Reverse Mortgage'
};

const APPLICANT_COUNT_LABELS: Record<ApplicantCount, string> = {
  one_applicant: 'Single',
  two_applicants: 'Two',
  three_or_more_applicants: '3+ Applicants'
};

const ProjectsSection = ({ 
  projects, 
  brokerageId, 
  onCreateProject,
  onDeleteProject,
  onOpenProject
}: ProjectsSectionProps) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleDeleteProject = async () => {
    if (deleteProjectId) {
      await onDeleteProject(deleteProjectId);
      setDeleteProjectId(null);
    }
  };

  return (
    <BrokerageActionCard
      title="Projects"
      description="Manage all mortgage projects for your brokerage"
      icon={FileText}
      className="gomutuo-card-action"
      headerActions={
        <Button 
          onClick={() => setIsWizardOpen(true)} 
          className="gomutuo-button-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      }
    >
      {projects.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 font-dm-sans text-form-green">No projects yet</h3>
          <p className="text-muted-foreground mb-4 font-dm-sans">
            Create your first project to start managing mortgage applications
          </p>
          <Button 
            onClick={() => setIsWizardOpen(true)}
            className="gomutuo-button-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Project
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-4 border border-form-border rounded-[12px] bg-form-beige hover:shadow-md transition-all duration-200 gomutuo-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-lg font-dm-sans text-form-green">{project.name}</h4>
                    <div className="flex gap-1">
                      {project.project_type && (
                        <Badge variant="secondary" className="text-xs gomutuo-selection-tag">
                          <Building2 className="h-3 w-3 mr-1" />
                          {PROJECT_TYPE_LABELS[project.project_type]}
                        </Badge>
                      )}
                      {project.applicant_count && (
                        <Badge variant="outline" className="text-xs border-form-border">
                          <Users className="h-3 w-3 mr-1" />
                          {APPLICANT_COUNT_LABELS[project.applicant_count]}
                        </Badge>
                      )}
                      {project.has_guarantor && (
                        <Badge className="text-xs bg-form-green text-white">
                          <Shield className="h-3 w-3 mr-1" />
                          Guarantor
                        </Badge>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-muted-foreground text-sm mt-1 font-dm-sans">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 font-dm-sans">
                      <Calendar className="h-4 w-4" />
                      Created: {formatDate(project.created_at)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium font-dm-sans ${
                      project.status === 'active' 
                        ? 'bg-accent-yellow text-form-green' 
                        : project.status === 'pending_approval'
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onOpenProject(project.id)}
                    className="gomutuo-button-secondary"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteProjectId(project.id)}
                    className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Creation Wizard */}
      <ProjectCreationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCreateProject={onCreateProject}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent className="gomutuo-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-dm-sans text-form-green">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="font-dm-sans">
              Are you sure you want to delete this project? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="gomutuo-button-secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-dm-sans"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BrokerageActionCard>
  );
};

export default ProjectsSection;
