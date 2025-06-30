
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Users, ArrowLeft } from 'lucide-react';
import { useProjectData } from '@/hooks/useProjectData';
import { useParams } from 'react-router-dom';
import { getApplicantDisplayNames } from '@/utils/applicantHelpers';

interface ApplicantSelectorProps {
  onSelectApplicant: (applicant: 'applicant_1' | 'applicant_2') => void;
  onBack: () => void;
}

const ApplicantSelector = ({ onSelectApplicant, onBack }: ApplicantSelectorProps) => {
  const { projectId } = useParams();
  const { project, loading } = useProjectData(projectId);

  if (loading || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gomutuo-button-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle Categorie
          </Button>
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-form-green mx-auto mb-4"></div>
          <p className="text-muted-foreground font-dm-sans">Caricamento...</p>
        </div>
      </div>
    );
  }

  const { primaryApplicant, secondaryApplicant } = getApplicantDisplayNames(project);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gomutuo-button-secondary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle Categorie
        </Button>
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-6 font-dm-sans text-form-green">Seleziona Richiedente</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer border-2 border-form-border hover:border-form-green bg-white rounded-[16px]"
          onClick={() => onSelectApplicant('applicant_1')}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <User className="h-16 w-16 text-form-green mb-4" />
            <h3 className="text-xl font-semibold font-dm-sans text-form-green mb-2">
              {primaryApplicant || 'Richiedente 1'}
            </h3>
            <p className="text-sm text-gray-600 font-dm-sans">Richiedente Principale</p>
          </CardContent>
        </Card>
        
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer border-2 border-form-border hover:border-form-green bg-white rounded-[16px]"
          onClick={() => onSelectApplicant('applicant_2')}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Users className="h-16 w-16 text-form-green mb-4" />
            <h3 className="text-xl font-semibold font-dm-sans text-form-green mb-2">
              {secondaryApplicant || 'Richiedente 2'}
            </h3>
            <p className="text-sm text-gray-600 font-dm-sans">Secondo Richiedente</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicantSelector;
