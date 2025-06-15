
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import CategoryBox from '@/components/project/CategoryBox';
import ApplicantSelector from '@/components/project/ApplicantSelector';
import CategoryQuestions from '@/components/project/CategoryQuestions';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

// Mock categories data - will be replaced with actual data fetching later
const MOCK_CATEGORIES = [
  { id: '1', name: 'Offerta' },
  { id: '2', name: 'Professione' },
  { id: '3', name: 'Redditi Secondari' },
  { id: '4', name: 'Finanziamenti' },
  { id: '5', name: 'Patrimonio' },
];

// Mock project data - will be replaced with actual data fetching later
const MOCK_PROJECT = {
  id: 'project-1',
  name: 'Sample Project',
  applicant_count: 'two_applicants' as const,
};

type ViewState = 
  | { type: 'categories' }
  | { type: 'applicant_selection'; categoryId: string; categoryName: string }
  | { type: 'questions'; categoryId: string; categoryName: string; applicant?: 'applicant_1' | 'applicant_2' };

const ProjectDocuments = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [viewState, setViewState] = useState<ViewState>({ type: 'categories' });

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

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    // Check if this is "La Casa" category or if project has only one applicant
    const isLaCasaCategory = categoryName.toLowerCase() === 'la casa';
    const hasMultipleApplicants = MOCK_PROJECT.applicant_count === 'two_applicants';
    
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

  const renderContent = () => {
    switch (viewState.type) {
      case 'categories':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Project Documents</h1>
              <p className="text-muted-foreground mt-1">
                Select a category to view and manage related documents and information
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
      title={`${MOCK_PROJECT.name} - Documents`}
      userEmail={user?.email || ''}
      onLogout={handleLogout}
    >
      {renderContent()}
    </MainLayout>
  );
};

export default ProjectDocuments;
