
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import ConditionalLogicErrorBoundary from '../ConditionalLogicErrorBoundary';
import ConditionalLogicLoader from '../ConditionalLogicLoader';
import QuestionRenderer from './QuestionRenderer';
import type { TypedChecklistItem } from '@/services/checklistItemService';

interface AdditionalQuestionsRendererProps {
  additionalQuestions: TypedChecklistItem[];
  additionalFormData: Record<string, any>;
  activeSubcategories: string[];
  logicLoading: boolean;
  saving: boolean;
  onAdditionalInputChange: (itemId: string, value: any) => void;
  onSaveAdditional: () => void;
  onConditionalLogicReset: () => void;
}

const AdditionalQuestionsRenderer: React.FC<AdditionalQuestionsRendererProps> = ({
  additionalQuestions,
  additionalFormData,
  activeSubcategories,
  logicLoading,
  saving,
  onAdditionalInputChange,
  onSaveAdditional,
  onConditionalLogicReset,
}) => {
  if (logicLoading) {
    return <ConditionalLogicLoader isEvaluating={true} />;
  }

  if (additionalQuestions.length === 0) {
    return (
      <div className="bg-muted/50 p-8 rounded-lg text-center">
        <p className="text-lg text-muted-foreground">
          No additional questions at this time.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Additional questions will appear here after you save answers to the main questions that trigger conditional logic.
        </p>
      </div>
    );
  }

  return (
    <ConditionalLogicErrorBoundary onReset={onConditionalLogicReset}>
      <div className="space-y-6">
        {activeSubcategories.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Active Subcategories:</strong> {activeSubcategories.join(', ')}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              These additional questions appeared based on your answers to the main questions.
            </p>
          </div>
        )}

        <div className="bg-card p-6 rounded-lg border">
          <div className="space-y-8">
            {additionalQuestions.map((item, index) => {
              const currentValue = additionalFormData[item.id] ?? item.displayValue ?? '';
              
              return (
                <div key={`additional-${item.id}`} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <Label className="text-base font-medium leading-relaxed">
                      {index + 1}. {item.itemName}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      Priority: {item.priority || 0}
                    </span>
                  </div>
                  <div className="ml-0">
                    <QuestionRenderer
                      item={item}
                      currentValue={currentValue}
                      onChange={onAdditionalInputChange}
                      isAdditional={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={onSaveAdditional} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Additional Answers'}
          </Button>
        </div>
      </div>
    </ConditionalLogicErrorBoundary>
  );
};

export default React.memo(AdditionalQuestionsRenderer);
