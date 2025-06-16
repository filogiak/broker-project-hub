
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import QuestionRenderer from './QuestionRenderer';
import type { TypedChecklistItem } from '@/services/checklistItemService';

interface MainQuestionsRendererProps {
  categoryItems: TypedChecklistItem[];
  formData: Record<string, any>;
  hasUnsavedChanges: boolean;
  saveError: string | null;
  lastSaveTime: Date | null;
  saving: boolean;
  onInputChange: (itemId: string, value: any) => void;
  onSave: () => void;
}

const MainQuestionsRenderer: React.FC<MainQuestionsRendererProps> = ({
  categoryItems,
  formData,
  hasUnsavedChanges,
  saveError,
  lastSaveTime,
  saving,
  onInputChange,
  onSave,
}) => {
  if (categoryItems.length === 0) {
    return (
      <div className="bg-muted/50 p-8 rounded-lg text-center">
        <p className="text-lg text-muted-foreground">
          No questions available for this category yet.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Questions will be automatically generated based on the project configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save status indicator */}
      {(hasUnsavedChanges || saveError || lastSaveTime) && (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <>
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-700">You have unsaved changes</span>
              </>
            )}
            {!hasUnsavedChanges && lastSaveTime && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">
                  Last saved at {lastSaveTime.toLocaleTimeString()}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error alert */}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {saveError}. Please try saving again.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-card p-6 rounded-lg border">
        <div className="space-y-8">
          {categoryItems.map((item, index) => {
            const currentValue = formData[item.id] ?? item.displayValue ?? '';
            
            return (
              <div key={`main-${item.id}`} className="space-y-3">
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
                    onChange={onInputChange}
                    isAdditional={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={onSave} 
          disabled={saving || !hasUnsavedChanges}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Answers'}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(MainQuestionsRenderer);
