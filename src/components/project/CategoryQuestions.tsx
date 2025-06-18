
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTypedChecklistItems } from '@/hooks/useTypedChecklistItems';
import { useConditionalLogic } from '@/hooks/useConditionalLogic';
import { useParams } from 'react-router-dom';
import MainQuestionsRenderer from './questions/MainQuestionsRenderer';
import AdditionalQuestionsRenderer from './questions/AdditionalQuestionsRenderer';
import DocumentsRenderer from './questions/DocumentsRenderer';
import { ChecklistItemService } from '@/services/checklistItemService';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

interface CategoryQuestionsProps {
  categoryId: string;
  categoryName: string;
  applicant?: 'applicant_1' | 'applicant_2';
  onBack: () => void;
}

const CategoryQuestions = React.memo(({ categoryId, categoryName, applicant, onBack }: CategoryQuestionsProps) => {
  const { projectId } = useParams();
  const [mainFormData, setMainFormData] = useState<Record<string, any>>({});
  const [additionalFormData, setAdditionalFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  const participantDesignation = useMemo(() => {
    return applicant === 'applicant_1' 
      ? 'applicant_one' as const
      : applicant === 'applicant_2' 
      ? 'applicant_two' as const
      : 'solo_applicant' as const;
  }, [applicant]);

  const {
    items,
    loading,
    updateItem,
    validateAndConvertValue,
    refreshItems,
  } = useTypedChecklistItems(projectId!, categoryId, participantDesignation);

  const {
    additionalQuestions,
    loading: logicLoading,
    activeSubcategories,
    evaluateOnSave,
    loadExistingAdditionalQuestions,
  } = useConditionalLogic(projectId!, categoryId, participantDesignation);

  // Filter items by type for different tabs
  const { mainQuestions, documentQuestions, additionalDocuments } = useMemo(() => {
    console.log('Filtering items for tabs:', items);
    
    const main = items.filter(item => {
      const isMain = ChecklistItemService.isMainQuestion(item);
      const isDocument = item.itemType === 'document';
      console.log(`Item ${item.itemName}: isMain=${isMain}, isDocument=${isDocument}`);
      return isMain && !isDocument;
    });
    
    const documents = items.filter(item => 
      item.itemType === 'document' && ChecklistItemService.isMainQuestion(item)
    );
    
    // Filter additional questions to exclude initiator questions
    const additionalNonDocs = additionalQuestions.filter(item => {
      const isDocument = item.itemType === 'document';
      const isInitiator = item.subcategory1Initiator || 
                         item.subcategory2Initiator || 
                         item.subcategory3Initiator || 
                         item.subcategory4Initiator || 
                         item.subcategory5Initiator;
      return !isDocument && !isInitiator;
    });
    
    const additionalDocs = additionalQuestions.filter(item => 
      item.itemType === 'document'
    );
    
    console.log('Filtered results:', { 
      main: main.length, 
      documents: documents.length, 
      additionalNonDocs: additionalNonDocs.length,
      additionalDocs: additionalDocs.length 
    });
    
    return {
      mainQuestions: main.sort((a, b) => (a.priority || 0) - (b.priority || 0)),
      documentQuestions: documents.sort((a, b) => (a.priority || 0) - (b.priority || 0)),
      additionalDocuments: additionalDocs.sort((a, b) => (a.priority || 0) - (b.priority || 0)),
      additionalNonDocuments: additionalNonDocs.sort((a, b) => (a.priority || 0) - (b.priority || 0))
    };
  }, [items, additionalQuestions]);

  // Initialize form data with existing values using checklist item IDs
  useEffect(() => {
    const initialMainData: Record<string, any> = {};
    mainQuestions.forEach(item => {
      if (item.displayValue !== null && item.displayValue !== undefined && item.displayValue !== '') {
        initialMainData[item.id] = item.displayValue;
      }
    });
    setMainFormData(initialMainData);
    console.log('Initialized main form data:', initialMainData);
  }, [mainQuestions]);

  useEffect(() => {
    const initialAdditionalData: Record<string, any> = {};
    additionalQuestions.forEach(item => {
      if (item.displayValue !== null && item.displayValue !== undefined && item.displayValue !== '') {
        initialAdditionalData[item.id] = item.displayValue;
      }
    });
    setAdditionalFormData(initialAdditionalData);
    console.log('Initialized additional form data:', initialAdditionalData);
  }, [additionalQuestions]);

  const handleMainInputChange = useCallback((itemId: string, value: any) => {
    console.log('Main input change:', { itemId, value });
    setMainFormData(prev => ({
      ...prev,
      [itemId]: value,
    }));
    setHasUnsavedChanges(true);
    setSaveError(null);
  }, []);

  const handleAdditionalInputChange = useCallback((itemId: string, value: any) => {
    console.log('Additional input change:', { itemId, value });
    setAdditionalFormData(prev => ({
      ...prev,
      [itemId]: value,
    }));
  }, []);

  const handleSaveMain = useCallback(async () => {
    if (!projectId) {
      console.error('No project ID available');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      console.log('Starting save with form data:', mainFormData);
      
      // Save main questions - each entry in mainFormData uses checklist item ID as key
      const savePromises = [];
      const savedData: Record<string, any> = {};
      
      for (const [checklistItemId, inputValue] of Object.entries(mainFormData)) {
        if (inputValue === undefined || inputValue === '' || inputValue === null) {
          console.log(`Skipping empty value for item ${checklistItemId}`);
          continue;
        }

        // Find the item to get its type and itemId (required_items.id)
        const item = mainQuestions.find(q => q.id === checklistItemId);
        if (!item) {
          console.error(`Item not found for checklist item ID: ${checklistItemId}`);
          continue;
        }

        console.log(`Saving item ${checklistItemId} (${item.itemName}):`, inputValue);
        
        try {
          const typedValue = validateAndConvertValue(item.itemType as Database['public']['Enums']['item_type'], inputValue);
          console.log(`Converted value for ${checklistItemId}:`, typedValue);
          
          const success = await updateItem(checklistItemId, typedValue, 'submitted');
          if (success) {
            // Store the saved data using itemId (required_items.id) for conditional logic
            savedData[item.itemId] = typedValue;
            savePromises.push(Promise.resolve(true));
          }
        } catch (validationError) {
          console.error(`Validation error for item ${checklistItemId}:`, validationError);
          throw validationError;
        }
      }

      console.log(`Attempted to save ${Object.keys(mainFormData).length} items`);
      console.log('Saved data for conditional logic:', savedData);

      // Wait for all saves to complete
      await Promise.all(savePromises);

      // Evaluate conditional logic after saving - use itemId (required_items.id)
      console.log('Evaluating conditional logic with saved data:', savedData);
      const { subcategories } = await evaluateOnSave(savedData, {});
      
      if (subcategories.length > 0) {
        console.log('Conditional logic triggered new subcategories:', subcategories);
        // Refresh items to get newly created questions
        await refreshItems();
        await loadExistingAdditionalQuestions();
      }
      
      setHasUnsavedChanges(false);
      setLastSaveTime(new Date());
      
      toast.success('Main answers saved successfully!', {
        description: `Saved at ${new Date().toLocaleTimeString()}`,
      });
      
    } catch (error) {
      console.error('Error saving main form data:', error);
      setSaveError('Failed to save main answers');
      toast.error('Failed to save main answers', {
        description: error instanceof Error ? error.message : 'Please check your internet connection and try again.',
      });
    } finally {
      setSaving(false);
    }
  }, [projectId, mainQuestions, mainFormData, validateAndConvertValue, updateItem, evaluateOnSave, refreshItems, loadExistingAdditionalQuestions]);

  const handleSaveAdditional = useCallback(async () => {
    if (!projectId) {
      console.error('No project ID available');
      return;
    }

    try {
      setSaving(true);
      console.log('Saving additional form data:', additionalFormData);
      
      const savePromises = [];
      
      for (const [checklistItemId, inputValue] of Object.entries(additionalFormData)) {
        if (inputValue === undefined || inputValue === '' || inputValue === null) {
          console.log(`Skipping empty value for additional item ${checklistItemId}`);
          continue;
        }

        // Find the item to get its type
        const item = additionalQuestions.find(q => q.id === checklistItemId);
        if (!item) {
          console.error(`Additional item not found for checklist item ID: ${checklistItemId}`);
          continue;
        }

        console.log(`Saving additional item ${checklistItemId} (${item.itemName}):`, inputValue);
        
        try {
          const typedValue = validateAndConvertValue(item.itemType as Database['public']['Enums']['item_type'], inputValue);
          console.log(`Converted additional value for ${checklistItemId}:`, typedValue);
          savePromises.push(updateItem(checklistItemId, typedValue, 'submitted'));
        } catch (validationError) {
          console.error(`Validation error for additional item ${checklistItemId}:`, validationError);
          throw validationError;
        }
      }

      console.log(`Saving ${savePromises.length} additional items...`);
      const results = await Promise.all(savePromises);
      const successCount = results.filter(result => result).length;
      
      toast.success(`Additional answers saved successfully! (${successCount} items)`, {
        description: `Saved at ${new Date().toLocaleTimeString()}`,
      });
      
    } catch (error) {
      console.error('Error saving additional form data:', error);
      toast.error('Failed to save additional answers', {
        description: error instanceof Error ? error.message : 'Please check your internet connection and try again.',
      });
    } finally {
      setSaving(false);
    }
  }, [projectId, additionalQuestions, additionalFormData, validateAndConvertValue, updateItem]);

  const handleConditionalLogicReset = useCallback(() => {
    loadExistingAdditionalQuestions();
  }, [loadExistingAdditionalQuestions]);

  if (loading) {
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
        
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

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
      
      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="main" className="relative">
            Main Questions
            {hasUnsavedChanges && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full"></span>
            )}
          </TabsTrigger>
          <TabsTrigger value="additional" className="relative">
            Additional Questions
            {(additionalQuestions.filter(q => q.itemType !== 'document' && !q.subcategory1Initiator && !q.subcategory2Initiator && !q.subcategory3Initiator && !q.subcategory4Initiator && !q.subcategory5Initiator).length) > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {additionalQuestions.filter(q => q.itemType !== 'document' && !q.subcategory1Initiator && !q.subcategory2Initiator && !q.subcategory3Initiator && !q.subcategory4Initiator && !q.subcategory5Initiator).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="relative">
            Documents
            {(documentQuestions.length + additionalDocuments.length) > 0 && (
              <span className="ml-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {documentQuestions.length + additionalDocuments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="mt-6">
          <MainQuestionsRenderer
            categoryItems={mainQuestions}
            formData={mainFormData}
            hasUnsavedChanges={hasUnsavedChanges}
            saveError={saveError}
            lastSaveTime={lastSaveTime}
            saving={saving}
            onInputChange={handleMainInputChange}
            onSave={handleSaveMain}
          />
        </TabsContent>

        <TabsContent value="additional" className="mt-6">
          <AdditionalQuestionsRenderer
            additionalQuestions={additionalQuestions.filter(q => q.itemType !== 'document' && !q.subcategory1Initiator && !q.subcategory2Initiator && !q.subcategory3Initiator && !q.subcategory4Initiator && !q.subcategory5Initiator)}
            additionalFormData={additionalFormData}
            activeSubcategories={activeSubcategories}
            logicLoading={logicLoading}
            saving={saving}
            onAdditionalInputChange={handleAdditionalInputChange}
            onSaveAdditional={handleSaveAdditional}
            onConditionalLogicReset={handleConditionalLogicReset}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsRenderer
            documentItems={documentQuestions}
            additionalDocuments={additionalDocuments}
            formData={mainFormData}
            additionalFormData={additionalFormData}
            hasUnsavedChanges={hasUnsavedChanges}
            saveError={saveError}
            lastSaveTime={lastSaveTime}
            saving={saving}
            onInputChange={handleMainInputChange}
            onAdditionalInputChange={handleAdditionalInputChange}
            onSave={handleSaveMain}
            onSaveAdditional={handleSaveAdditional}
            logicLoading={logicLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
});

CategoryQuestions.displayName = 'CategoryQuestions';

export default CategoryQuestions;
