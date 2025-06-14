
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Users, ArrowLeft } from 'lucide-react';

interface ApplicantSelectorProps {
  onSelectApplicant: (applicant: 'applicant_1' | 'applicant_2') => void;
  onBack: () => void;
}

const ApplicantSelector = ({ onSelectApplicant, onBack }: ApplicantSelectorProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Categories
        </Button>
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-6">Select Applicant</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50"
          onClick={() => onSelectApplicant('applicant_1')}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <User className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold">Applicant 1</h3>
          </CardContent>
        </Card>
        
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50"
          onClick={() => onSelectApplicant('applicant_2')}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Users className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold">Applicant 2</h3>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicantSelector;
