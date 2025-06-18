
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
    
    const additionalDocs = additionalQuestions.filter(item => 
      item.itemType === 'document'
    );
    
    console.log('Filtered results:', { main: main.length, documents: documents.length, additionalDocs: additionalDocs.length });
    
    return {
      mainQuestions: main.sort((a, b) => (a.priority || 0) - (b.priority || 0)),
      documentQuestions: documents.sort((a, b) => (a.priority || 0) - (b.priority || 0)),
      additionalDocuments: additionalDocs.sort((a, b) => (a.priority || 0) - (b.priority || 0))
    };
  }, [items, additionalQuestions]);

  // Initialize form data with existing values
  useEffect(() => {
    const initialMainData: Record<string, any> = {};
    mainQuestions.forEach(item => {
      if (item.displayValue && item.displayValue !== '') {
        initialMainData[item.id] = item.displayValue;
      }
    });
    setMainFormData(initialMainData);
  }, [mainQuestions]);

  useEffect(() => {
    const initialAdditionalData: Record<string, any> = {};
    additionalQuestions.forEach(item => {
      if (item.displayValue && item.displayValue !== '') {
        initialAdditionalData[item.id] = item.displayValue;
      }
    });
    setAdditionalFormData(initialAdditionalData);
  }, [additionalQuestions]);

  const handleMainInputChange = useCallback((itemId: string, value: any) => {
    setMainFormData(prev => ({
      ...prev,
      [itemId]: value,
    }));
    setHasUnsavedChanges(true);
    setSaveError(null);
  }, []);

  const handleAdditionalInputChange = useCallback((itemId: string, value: any) => {
    setAdditionalFormData(prev => ({
      ...prev,
      [itemId]: value,
    }));
  }, []);

  const handleSaveMain = useCallback(async () => {
    if (!projectId) return;

    try {
      setSaving(true);
      setSaveError(null);
      
      // Create item ID to form ID mapping for conditional logic
      const itemIdToFormIdMap: Record<string, string> = {};
      mainQuestions.forEach(item => {
        itemIdToFormIdMap[item.itemId] = item.id;
      });

      // Save main questions
      const savePromises = [];
      for (const item of mainQuestions) {
        const inputValue = mainFormData[item.id];
        if (inputValue === undefined || inputValue === '') continue;

        const typedValue = validateAndConvertValue(item.itemType as Database['public']['Enums']['item_type'], inputValue);
        savePromises.push(updateItem(item.id, typedValue, 'submitted'));
      }

      await Promise.all(savePromises);

      // Evaluate conditional logic after saving
      console.log('Evaluating conditional logic with data:', mainFormData);
      const { subcategories } = await evaluateOnSave(mainFormData, itemIdToFormIdMap);
      
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
        description: 'Please check your internet connection and try again.',
      });
    } finally {
      setSaving(false);
    }
  }, [projectId, mainQuestions, mainFormData, validateAndConvertValue, updateItem, evaluateOnSave, refreshItems, loadExistingAdditionalQuestions]);

  const handleSaveAdditional = useCallback(async () => {
    if (!projectId) return;

    try {
      setSaving(true);
      const savePromises = [];
      
      for (const item of additionalQuestions) {
        const inputValue = additionalFormData[item.id];
        if (inputValue === undefined || inputValue === '') continue;

        const typedValue = validateAndConvertValue(item.itemType as Database['public']['Enums']['item_type'], inputValue);
        savePromises.push(updateItem(item.id, typedValue, 'submitted'));
      }

      await Promise.all(savePromises);
      
      toast.success('Additional answers saved successfully!', {
        description: `Saved at ${new Date().toLocaleTimeString()}`,
      });
      
    } catch (error) {
      console.error('Error saving additional form data:', error);
      toast.error('Failed to save additional answers', {
        description: 'Please check your internet connection and try again.',
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
            {additionalQuestions.length > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {additionalQuestions.filter(q => q.itemType !== 'document').length}
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
            additionalQuestions={additionalQuestions.filter(q => q.itemType !== 'document')}
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
