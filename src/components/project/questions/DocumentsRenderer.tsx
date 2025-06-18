
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import DocumentUploadQuestion from './DocumentUploadQuestion';
import { useParams } from 'react-router-dom';
import type { TypedChecklistItem } from '@/services/checklistItemService';

interface DocumentsRendererProps {
  documentItems: TypedChecklistItem[];
  additionalDocuments: TypedChecklistItem[];
  formData: Record<string, any>;
  additionalFormData: Record<string, any>;
  hasUnsavedChanges: boolean;
  saveError: string | null;
  lastSaveTime: Date | null;
  saving: boolean;
  onInputChange: (itemId: string, value: any) => void;
  onAdditionalInputChange: (itemId: string, value: any) => void;
  onSave: () => void;
  onSaveAdditional: () => void;
  logicLoading: boolean;
}

const DocumentsRenderer: React.FC<DocumentsRendererProps> = ({
  documentItems,
  additionalDocuments,
  formData,
  additionalFormData,
  hasUnsavedChanges,
  saveError,
  lastSaveTime,
  saving,
  onInputChange,
  onAdditionalInputChange,
  onSave,
  onSaveAdditional,
  logicLoading,
}) => {
  const { projectId } = useParams();

  if (documentItems.length === 0 && additionalDocuments.length === 0) {
    return (
      <div className="bg-muted/50 p-8 rounded-lg text-center">
        <p className="text-lg text-muted-foreground">
          No documents required for this category yet.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Document requirements will be automatically generated based on your answers to other questions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save status indicator for main documents */}
      {documentItems.length > 0 && (hasUnsavedChanges || saveError || lastSaveTime) && (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <>
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-700">You have unsaved document changes</span>
              </>
            )}
            {!hasUnsavedChanges && lastSaveTime && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">
                  Documents last saved at {lastSaveTime.toLocaleTimeString()}
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

      {/* Main Documents Section */}
      {documentItems.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Required Documents</h3>
            <Button 
              onClick={onSave} 
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-2"
              size="sm"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Documents'}
            </Button>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <div className="space-y-8">
              {documentItems.map((item, index) => {
                const currentValue = formData[item.id] ?? item.displayValue ?? '';
                
                return (
                  <div key={`doc-${item.id}`} className="space-y-3">
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
                      <DocumentUploadQuestion
                        question={item}
                        value={currentValue}
                        onChange={(value) => onInputChange(item.id, value)}
                        projectId={projectId!}
                        participantDesignation={item.participantDesignation}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Additional Documents Section */}
      {additionalDocuments.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Additional Documents</h3>
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {additionalDocuments.length}
              </span>
            </div>
            <Button 
              onClick={onSaveAdditional} 
              disabled={saving}
              className="flex items-center gap-2"
              size="sm"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Additional Documents'}
            </Button>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="space-y-8">
              {additionalDocuments.map((item, index) => {
                const currentValue = additionalFormData[item.id] ?? item.displayValue ?? '';
                
                return (
                  <div key={`additional-doc-${item.id}`} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Label className="text-base font-medium leading-relaxed">
                        {index + 1}. {item.itemName}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        Additional
                      </span>
                    </div>
                    <div className="ml-0">
                      <DocumentUploadQuestion
                        question={item}
                        value={currentValue}
                        onChange={(value) => onAdditionalInputChange(item.id, value)}
                        projectId={projectId!}
                        participantDesignation={item.participantDesignation}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Loading state for conditional logic */}
      {logicLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading additional document requirements...</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(DocumentsRenderer);
