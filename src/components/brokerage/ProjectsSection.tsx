
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Users, Calendar, Trash2, ExternalLink, Building2, Shield } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import StandardCard from '@/components/ui/StandardCard';
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
    <StandardCard
      title="Projects"
      description="Manage all mortgage projects for your brokerage"
      icon={FileText}
      variant="action"
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
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-form-green mx-auto mb-6" />
          <h3 className="gomutuo-title mb-3">No projects yet</h3>
          <p className="gomutuo-text mb-6 max-w-md mx-auto">
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
              className="p-6 border-2 border-form-green rounded-[12px] bg-white hover:shadow-lg transition-all duration-200 solid-shadow-green press-down-effect-green"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="gomutuo-title">{project.name}</h4>
                    <div className="flex gap-2">
                      {project.project_type && (
                        <Badge className="gomutuo-badge-secondary">
                          <Building2 className="h-3 w-3 mr-1" />
                          {PROJECT_TYPE_LABELS[project.project_type]}
                        </Badge>
                      )}
                      {project.applicant_count && (
                        <Badge className="gomutuo-selection-tag">
                          <Users className="h-3 w-3 mr-1" />
                          {APPLICANT_COUNT_LABELS[project.applicant_count]}
                        </Badge>
                      )}
                      {project.has_guarantor && (
                        <Badge className="gomutuo-badge-primary">
                          <Shield className="h-3 w-3 mr-1" />
                          Guarantor
                        </Badge>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <p className="gomutuo-text mb-3">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-2 gomutuo-text">
                      <Calendar className="h-4 w-4" />
                      Created: {formatDate(project.created_at)}
                    </span>
                    <span className={`px-3 py-1 rounded-[8px] text-sm font-medium font-dm-sans ${
                      project.status === 'active' 
                        ? 'gomutuo-badge-yellow' 
                        : project.status === 'pending_approval'
                        ? 'bg-orange-200 text-orange-800 border border-orange-300'
                        : 'bg-gray-200 text-gray-700 border border-gray-300'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
                    className="text-destructive hover:text-destructive border-2 border-destructive hover:bg-destructive/10 solid-shadow-red press-down-effect-red"
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
        <AlertDialogContent className="bg-white border-2 border-form-green rounded-[12px] solid-shadow-green">
          <AlertDialogHeader>
            <AlertDialogTitle className="gomutuo-title">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="gomutuo-text">
              Are you sure you want to delete this project? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="gomutuo-button-secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-dm-sans solid-shadow-red press-down-effect-red"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StandardCard>
  );
};

export default ProjectsSection;
