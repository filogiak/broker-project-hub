
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface CategoryQuestionsProps {
  categoryName: string;
  applicant?: 'applicant_1' | 'applicant_2';
  onBack: () => void;
}

const CategoryQuestions = ({ categoryName, applicant, onBack }: CategoryQuestionsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{categoryName}</h2>
          {applicant && (
            <p className="text-muted-foreground">
              {applicant === 'applicant_1' ? 'Applicant 1' : 'Applicant 2'}
            </p>
          )}
        </div>
      </div>
      
      <div className="bg-muted/50 p-8 rounded-lg text-center">
        <p className="text-lg text-muted-foreground">
          Questions for this category will be displayed here.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Question rendering and interaction will be implemented in the next phase.
        </p>
      </div>
    </div>
  );
};

export default CategoryQuestions;
