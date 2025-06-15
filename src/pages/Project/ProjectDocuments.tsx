
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import CategoryBox from '@/components/project/CategoryBox';
import ApplicantSelector from '@/components/project/ApplicantSelector';
import CategoryQuestions from '@/components/project/CategoryQuestions';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Updated categories to match actual database data
const MOCK_CATEGORIES = [
  { id: '1', name: 'La Casa' },
  { id: '2', name: 'Professione' },
  { id: '3', name: 'Redditi Secondari' },
  { id: '4', name: 'Finanziamenti' },
  { id: '5', name: 'Patrimonio' },
];

type ViewState = 
  | { type: 'categories' }
  | { type: 'applicant_selection'; categoryId: string; categoryName: string }
  | { type: 'questions'; categoryId: string; categoryName: string; applicant?: 'applicant_1' | 'applicant_2' };

interface ProjectData {
  id: string;
  name: string;
  applicant_count: 'one_applicant' | 'two_applicants' | 'three_or_more_applicants';
}

const ProjectDocuments = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [viewState, setViewState] = useState<ViewState>({ type: 'categories' });
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) {
        setError('Project ID is required');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching project data for ID:', projectId);
        
        const { data, error: projectError } = await supabase
          .from('projects')
          .select('id, name, applicant_count')
          .eq('id', projectId)
          .single();

        if (projectError) {
          console.error('Error fetching project:', projectError);
          setError('Failed to load project data');
          setIsLoading(false);
          return;
        }

        if (!data) {
          setError('Project not found');
          setIsLoading(false);
          return;
        }

        console.log('Project data loaded:', data);
        setProjectData(data as ProjectData);
        setError(null);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "Failed to logout properly. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToProject = () => {
    navigate(`/project/${projectId}`);
  };

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    if (!projectData) return;

    // Check if this is "La Casa" category or if project has only one applicant
    const isLaCasaCategory = categoryName.toLowerCase() === 'la casa';
    const hasMultipleApplicants = projectData.applicant_count === 'two_applicants' || projectData.applicant_count === 'three_or_more_applicants';
    
    console.log('Category clicked:', categoryName, 'Project applicant count:', projectData.applicant_count, 'Has multiple applicants:', hasMultipleApplicants);
    
    if (isLaCasaCategory || !hasMultipleApplicants) {
      // Go directly to questions
      setViewState({
        type: 'questions',
        categoryId,
        categoryName
      });
    } else {
      // Show applicant selection
      setViewState({
        type: 'applicant_selection',
        categoryId,
        categoryName
      });
    }
  };

  const handleApplicantSelect = (applicant: 'applicant_1' | 'applicant_2') => {
    if (viewState.type === 'applicant_selection') {
      setViewState({
        type: 'questions',
        categoryId: viewState.categoryId,
        categoryName: viewState.categoryName,
        applicant
      });
    }
  };

  const handleBackToCategories = () => {
    setViewState({ type: 'categories' });
  };

  const handleBackToApplicantSelection = () => {
    if (viewState.type === 'questions') {
      setViewState({
        type: 'applicant_selection',
        categoryId: viewState.categoryId,
        categoryName: viewState.categoryName
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <MainLayout
        title="Loading Project..."
        userEmail={user?.email || ''}
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state
  if (error || !projectData) {
    return (
      <MainLayout
        title="Error"
        userEmail={user?.email || ''}
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Project not found'}</p>
            <Button onClick={handleBackToProject}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const renderContent = () => {
    switch (viewState.type) {
      case 'categories':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBackToProject}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Button>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-primary">Project Documents</h1>
              <p className="text-muted-foreground mt-1">
                Select a category to view and manage related documents and information
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Project type: {projectData.applicant_count.replace('_', ' ')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_CATEGORIES.map((category) => (
                <CategoryBox
                  key={category.id}
                  name={category.name}
                  onClick={() => handleCategoryClick(category.id, category.name)}
                />
              ))}
            </div>
          </div>
        );

      case 'applicant_selection':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-primary">{viewState.categoryName}</h1>
              <p className="text-muted-foreground mt-1">
                This category requires applicant-specific information
              </p>
            </div>
            <ApplicantSelector 
              onSelectApplicant={handleApplicantSelect}
              onBack={handleBackToCategories}
            />
          </div>
        );

      case 'questions':
        return (
          <CategoryQuestions
            categoryName={viewState.categoryName}
            applicant={viewState.applicant}
            onBack={viewState.applicant ? handleBackToApplicantSelection : handleBackToCategories}
          />
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout
      title={`${projectData.name} - Documents`}
      userEmail={user?.email || ''}
      onLogout={handleLogout}
    >
      {renderContent()}
    </MainLayout>
  );
};

export default ProjectDocuments;
