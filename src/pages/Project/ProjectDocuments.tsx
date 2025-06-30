import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProjectSidebar from '@/components/project/ProjectSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryBox from '@/components/project/CategoryBox';
import CategoryBoxSkeleton from '@/components/project/CategoryBoxSkeleton';
import ApplicantSelector from '@/components/project/ApplicantSelector';
import CategoryQuestions from '@/components/project/CategoryQuestions';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CategoryScopeService } from '@/services/categoryScopeService';
import { useCategoryCompletion } from '@/hooks/useCategoryCompletion';
import { populateApplicantNamesInChecklist } from '@/services/applicantNameService';
import { getApplicantDisplayNames } from '@/utils/applicantHelpers';
import type { Database } from '@/integrations/supabase/types';

type ViewState = 
  | { type: 'categories' }
  | { type: 'applicant_selection'; categoryId: string; categoryName: string }
  | { type: 'questions'; categoryId: string; categoryName: string; applicant?: 'applicant_1' | 'applicant_2' };

type Project = Database['public']['Tables']['projects']['Row'];

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
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { 
    completionData, 
    loading: completionLoading, 
    error: completionError,
    getCompletionForCategory,
    overallCompletion 
  } = useCategoryCompletion(
    projectId || '', 
    categories,
    projectData?.applicant_count !== 'one_applicant' ? 'applicant_one' : undefined
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
        
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
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
        
        setProjectData(projectData);
        setCategories(categoriesData || []);
        setError(null);

        if (categoriesData && categoriesData.length > 0) {
          const categoryIds = categoriesData.map(cat => cat.id);
          await CategoryScopeService.preloadCategoryScopes(categoryIds, projectId);
        }

        // Auto-populate applicant names if they exist but checklist items are empty
        if (projectData.applicant_one_first_name || projectData.applicant_one_last_name || 
            projectData.applicant_two_first_name || projectData.applicant_two_last_name) {
          console.log('🔧 Checking if applicant names need to be populated in checklist...');
          
          // Run this in the background, don't block the UI
          populateApplicantNamesInChecklist(projectId).catch(error => {
            console.error('⚠️ Failed to populate applicant names (non-critical):', error);
          });
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
    
    if (!hasMultipleApplicants) {
      console.log('📝 Single applicant project - going directly to questions');
      setViewState({
        type: 'questions',
        categoryId,
        categoryName
      });
      return;
    }

    try {
      const requiresParticipantSelection = await CategoryScopeService.checkCategoryRequiresParticipantSelection(
        categoryId, 
        projectId
      );

      console.log('🎯 Category requires participant selection:', requiresParticipantSelection);

      if (requiresParticipantSelection) {
        setViewState({
          type: 'applicant_selection',
          categoryId,
          categoryName
        });
      } else {
        setViewState({
          type: 'questions',
          categoryId,
          categoryName
        });
      }
    } catch (error) {
      console.error('Error checking category scope:', error);
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
        applicant: applicant === 'applicant_1' ? 'applicant_1' : 'applicant_2'
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

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background-light">
          <ProjectSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-form-green mx-auto mb-4"></div>
                <p className="text-muted-foreground font-dm-sans">Caricamento dati progetto...</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !projectData) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background-light">
          <ProjectSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-64">
              <div className="text-center">
                <p className="text-red-500 mb-4 font-dm-sans">{error || 'Progetto non trovato'}</p>
                <Button onClick={handleBackToProject} className="gomutuo-button-secondary">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna ai Progetti
                </Button>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Get applicant names for the header - BANNER FORMAT: Project name as title, applicant names as subtitle
  const { primaryApplicant, secondaryApplicant } = getApplicantDisplayNames(projectData);
  let applicantNames = primaryApplicant;
  if (secondaryApplicant && projectData.applicant_count !== 'one_applicant') {
    applicantNames = `${primaryApplicant} & ${secondaryApplicant}`;
  }

  const renderContent = () => {
    switch (viewState.type) {
      case 'categories':
        return (
          <div className="space-y-8">
            {/* Section Banner */}
            <Card className="bg-white border-0 shadow-none">
              <CardHeader>
                <CardTitle className="font-dm-sans text-black">
                  Dati e Documenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((category) => {
                    const completion = getCompletionForCategory(category.id);
                    
                    // Show skeleton if still loading and no completion data yet
                    if (completionLoading && !completion) {
                      return (
                        <CategoryBoxSkeleton key={`${category.id}-skeleton`} />
                      );
                    }
                    
                    return (
                      <CategoryBox
                        key={category.id}
                        name={category.name}
                        onClick={() => handleCategoryClick(category.id, category.name)}
                        completion={completion}
                        isLoading={completionLoading}
                      />
                    );
                  })}
                </div>
                
                {completionError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm font-dm-sans">
                      {completionError}. I dati potrebbero non essere aggiornati.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'applicant_selection':
        return (
          <div className="space-y-6">
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-light">
        <ProjectSidebar />
        <SidebarInset>
          <div className="flex-1 p-8">
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ProjectDocuments;
