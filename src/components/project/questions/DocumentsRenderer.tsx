
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import DocumentUploadQuestion from './DocumentUploadQuestion';
import ConditionalLogicLoader from '../ConditionalLogicLoader';
import { TypedChecklistItem } from '@/services/checklistItemService';

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
  logicLoading?: boolean;
}

const DocumentsRenderer = ({
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
  logicLoading = false
}: DocumentsRendererProps) => {
  
  const mainDocumentItems = useMemo(() => {
    return documentItems.filter(item => item.itemType === 'document');
  }, [documentItems]);

  const additionalDocumentItems = useMemo(() => {
    return additionalDocuments.filter(item => item.itemType === 'document');
  }, [additionalDocuments]);

  const getDocumentStatus = (item: TypedChecklistItem) => {
    const value = formData[item.id] || additionalFormData[item.id];
    if (!value) return 'missing';
    // You could check the actual document status from the database here
    return 'uploaded';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'missing': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'bg-green-100 text-green-800';
      case 'missing': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (mainDocumentItems.length === 0 && additionalDocumentItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-medium mb-2">No documents required</h3>
          <p>This category doesn't require any document uploads at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Save Status */}
      {(hasUnsavedChanges || saveError || lastSaveTime) && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">You have unsaved changes</span>
                  </div>
                )}
                {saveError && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Error: {saveError}</span>
                  </div>
                )}
                {!hasUnsavedChanges && !saveError && lastSaveTime && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Last saved at {lastSaveTime.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
              
              {hasUnsavedChanges && (
                <Button
                  onClick={onSave}
                  disabled={saving}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Documents'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Documents Section */}
      {mainDocumentItems.length > 0 && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Required Documents</h3>
            <p className="text-muted-foreground">
              Please upload the following documents for this category.
            </p>
          </div>

          <div className="space-y-6">
            {mainDocumentItems.map((item) => {
              const status = getDocumentStatus(item);
              return (
                <Card key={item.id} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getStatusIcon(status)}
                        {item.itemName}
                      </CardTitle>
                      <Badge className={getStatusColor(status)}>
                        {status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DocumentUploadQuestion
                      value={formData[item.id]}
                      onChange={(value) => onInputChange(item.id, value)}
                      required={true}
                      itemName={item.itemName}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Documents Section */}
      {additionalDocumentItems.length > 0 && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              Additional Documents
              <Badge variant="outline" className="text-xs">
                {additionalDocumentItems.length}
              </Badge>
            </h3>
            <p className="text-muted-foreground">
              Based on your answers, these additional documents are required.
            </p>
          </div>

          {logicLoading ? (
            <ConditionalLogicLoader message="Loading additional documents..." />
          ) : (
            <div className="space-y-6">
              {additionalDocumentItems.map((item) => {
                const status = getDocumentStatus(item);
                return (
                  <Card key={item.id} className="relative border-l-4 border-l-blue-500">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {getStatusIcon(status)}
                          {item.itemName}
                          <Badge variant="secondary" className="text-xs">Additional</Badge>
                        </CardTitle>
                        <Badge className={getStatusColor(status)}>
                          {status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <DocumentUploadQuestion
                        value={additionalFormData[item.id]}
                        onChange={(value) => onAdditionalInputChange(item.id, value)}
                        required={true}
                        itemName={item.itemName}
                      />
                    </CardContent>
                  </Card>
                );
              })}

              {additionalDocumentItems.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    onClick={onSaveAdditional}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Additional Documents'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentsRenderer;
