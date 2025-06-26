import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import CategoryBox from '@/components/project/CategoryBox';
import ApplicantSelector from '@/components/project/ApplicantSelector';
import CategoryQuestions from '@/components/project/CategoryQuestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CategoryScopeService } from '@/services/categoryScopeService';
import { useCategoryCompletion } from '@/hooks/useCategoryCompletion';

type ViewState = 
  | { type: 'categories' }
  | { type: 'applicant_selection'; categoryId: string; categoryName: string }
  | { type: 'questions'; categoryId: string; categoryName: string; applicant?: 'applicant_1' | 'applicant_2' };

interface ProjectData {
  id: string;
  name: string;
  applicant_count: 'one_applicant' | 'two_applicants' | 'three_or_more_applicants';
}

interface Category {
  id: string;
  name: string;
}

const ProjectDocuments = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [viewState, setViewState] = useState<ViewState>({ type: 'categories' });
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get completion data
  const { 
    completionData, 
    loading: completionLoading, 
    getCompletionForCategory,
    overallCompletion 
  } = useCategoryCompletion(
    projectId || '', 
    categories,
    // For now, we'll use applicant_1 as default for multi-applicant projects
    projectData?.applicant_count !== 'one_applicant' ? 'applicant_1' : undefined
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) {
        setError('Project ID is required');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching project and category data for ID:', projectId);
        
        // Fetch project data
        const { data: projectData, error: projectError } = await supabase
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

        if (!projectData) {
          setError('Project not found');
          setIsLoading(false);
          return;
        }

        // Fetch categories from the database
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('items_categories')
          .select('id, name')
          .order('display_order', { ascending: true });

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          setError('Failed to load categories');
          setIsLoading(false);
          return;
        }

        console.log('Project data loaded:', projectData);
        console.log('Categories loaded:', categoriesData);
        
        setProjectData(projectData as ProjectData);
        setCategories(categoriesData || []);
        setError(null);

        // Preload category scope information for better performance
        if (categoriesData && categoriesData.length > 0) {
          const categoryIds = categoriesData.map(cat => cat.id);
          await CategoryScopeService.preloadCategoryScopes(categoryIds, projectId);
        }

      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

  const handleCategoryClick = async (categoryId: string, categoryName: string) => {
    if (!projectData) return;

    console.log('🔧 Category clicked:', categoryName, 'Project applicant count:', projectData.applicant_count);
    
    const hasMultipleApplicants = projectData.applicant_count === 'two_applicants' || projectData.applicant_count === 'three_or_more_applicants';
    
    // For single applicant projects, always go directly to questions
    if (!hasMultipleApplicants) {
      console.log('📝 Single applicant project - going directly to questions');
      setViewState({
        type: 'questions',
        categoryId,
        categoryName
      });
      return;
    }

    // For multi-applicant projects, check if category requires participant selection
    try {
      const requiresParticipantSelection = await CategoryScopeService.checkCategoryRequiresParticipantSelection(
        categoryId, 
        projectId
      );

      console.log('🎯 Category requires participant selection:', requiresParticipantSelection);

      if (requiresParticipantSelection) {
        // Show applicant selection screen
        setViewState({
          type: 'applicant_selection',
          categoryId,
          categoryName
        });
      } else {
        // Go directly to questions (project-scoped only)
        setViewState({
          type: 'questions',
          categoryId,
          categoryName
        });
      }
    } catch (error) {
      console.error('Error checking category scope:', error);
      // Fallback to showing applicant selection (safer default)
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
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBackToProject}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Button>
            </div>
            
            {/* Title and Progress Section */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-primary">Project Documents</h1>
                  <p className="text-muted-foreground mt-1">
                    Select a category to view and manage related documents and information
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {overallCompletion.completionPercentage}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {overallCompletion.completedItems} of {overallCompletion.totalItems} completed
                  </p>
                </div>
              </div>
            </div>
            
            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <CategoryBox
                  key={category.id}
                  name={category.name}
                  onClick={() => handleCategoryClick(category.id, category.name)}
                  completion={getCompletionForCategory(category.id)}
                />
              ))}
            </div>

            {/* Documents Section */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">Documents</h3>
                    <p className="text-primary-foreground/80">
                      Uploaded documents and files for this project
                    </p>
                  </div>
                  <div className="text-2xl font-bold">
                    {overallCompletion.completedItems}
                  </div>
                </div>
              </CardContent>
            </Card>
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
            categoryId={viewState.categoryId}
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
      title={`${projectData?.name} - Documents`}
      userEmail={user?.email || ''}
      onLogout={handleLogout}
    >
      {renderContent()}
    </MainLayout>
  );
};

export default ProjectDocuments;
