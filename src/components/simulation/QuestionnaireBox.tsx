import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';

interface QuestionnaireBoxProps {
  title: string;
  description: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  id: string; // unique identifier for this box
}

const QuestionnaireBox: React.FC<QuestionnaireBoxProps> = ({
  title,
  description,
  onClick,
  loading = false,
  disabled = false,
  id,
}) => {
  return (
    <Card className="bg-white border border-[#BEB8AE] rounded-[12px] hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-form-green/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6 text-form-green" />
          </div>
          <h3 className="font-dm-sans font-semibold text-lg mb-2 text-black">
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 font-dm-sans">
            {description}
          </p>
          <Button 
            onClick={onClick}
            disabled={disabled || loading}
            className="bg-form-green hover:bg-form-green-dark text-white font-dm-sans"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Caricamento...
              </>
            ) : (
              'Compila Modulo'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionnaireBox;