
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ProjectType = Database['public']['Enums']['project_type'];
type ApplicantCount = Database['public']['Enums']['applicant_count'];

interface ProjectData {
  name: string;
  description: string;
  projectType: ProjectType | null;
  applicantCount: ApplicantCount;
  hasGuarantor: boolean;
}

interface ProjectCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: ProjectData) => Promise<void>;
}

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  purchase: 'Purchase',
  refinance: 'Refinance',
  cash_out_refinance: 'Cash-Out Refinance',
  heloc: 'Home Equity Line of Credit (HELOC)',
  construction: 'Construction Loan',
  bridge: 'Bridge Loan'
};

const APPLICANT_COUNT_LABELS: Record<ApplicantCount, string> = {
  one_applicant: 'Single Applicant',
  two_applicants: 'Two Applicants',
  three_or_more_applicants: 'Three or More Applicants'
};

const ProjectCreationWizard = ({ isOpen, onClose, onCreateProject }: ProjectCreationWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    projectType: null,
    applicantCount: 'one_applicant',
    hasGuarantor: false,
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!projectData.name.trim() || !projectData.projectType) return;

    setIsSubmitting(true);
    try {
      await onCreateProject(projectData);
      handleClose();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCurrentStep(1);
      setProjectData({
        name: '',
        description: '',
        projectType: null,
        applicantCount: 'one_applicant',
        hasGuarantor: false,
      });
      onClose();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return projectData.projectType !== null;
      case 2:
        return true; // applicantCount always has a default value
      case 3:
        return true; // hasGuarantor is boolean, always valid
      case 4:
        return projectData.name.trim().length > 0;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Select Project Type</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the type of mortgage project you're creating.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Project Type *</Label>
              <Select
                value={projectData.projectType || ''}
                onValueChange={(value) => 
                  setProjectData(prev => ({ ...prev, projectType: value as ProjectType }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Number of Applicants</h3>
              <p className="text-sm text-muted-foreground mb-4">
                How many applicants will be on this mortgage application?
              </p>
            </div>
            <div className="space-y-2">
              <Label>Applicant Count *</Label>
              <Select
                value={projectData.applicantCount}
                onValueChange={(value) => 
                  setProjectData(prev => ({ ...prev, applicantCount: value as ApplicantCount }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPLICANT_COUNT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Guarantor Requirement</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Will this mortgage application include a guarantor to secure the debt?
              </p>
            </div>
            <div className="space-y-3">
              <Label>Has Guarantor *</Label>
              <div className="space-y-2">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    !projectData.hasGuarantor
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setProjectData(prev => ({ ...prev, hasGuarantor: false }))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">No Guarantor</p>
                      <p className="text-sm text-muted-foreground">
                        Standard application without additional guarantor
                      </p>
                    </div>
                    {!projectData.hasGuarantor && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </div>
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    projectData.hasGuarantor
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setProjectData(prev => ({ ...prev, hasGuarantor: true }))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">With Guarantor</p>
                      <p className="text-sm text-muted-foreground">
                        Application includes a guarantor to secure the debt
                      </p>
                    </div>
                    {projectData.hasGuarantor && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Project Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Provide basic information about your project.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={projectData.description}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description (optional)"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Summary Card */}
              <Card className="bg-accent/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Project Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="secondary">
                      {projectData.projectType ? PROJECT_TYPE_LABELS[projectData.projectType] : 'Not selected'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Applicants:</span>
                    <Badge variant="secondary">
                      {APPLICANT_COUNT_LABELS[projectData.applicantCount]}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Guarantor:</span>
                    <Badge variant={projectData.hasGuarantor ? "default" : "outline"}>
                      {projectData.hasGuarantor ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Step {currentStep} of {totalSteps}: Set up your mortgage project
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center space-x-2 mb-6">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i + 1 <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {i + 1 <= currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    i + 1 < currentStep ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handleBack}
            disabled={isSubmitting}
          >
            {currentStep === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </>
            )}
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid() || isSubmitting}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreationWizard;
