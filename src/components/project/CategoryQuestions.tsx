
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { useTypedChecklistItems } from '@/hooks/useTypedChecklistItems';
import { useParams } from 'react-router-dom';
import { useConditionalLogic } from '@/hooks/useConditionalLogic';
import { ChecklistItemService } from '@/services/checklistItemService';
import ConditionalLogicLoader from './ConditionalLogicLoader';
import MainQuestionsRenderer from './questions/MainQuestionsRenderer';
import AdditionalQuestionsRenderer from './questions/AdditionalQuestionsRenderer';
import { toast } from 'sonner';

interface CategoryQuestionsProps {
  categoryId: string;
  categoryName: string;
  applicant?: 'applicant_1' | 'applicant_2';
  onBack: () => void;
}

const CategoryQuestions = React.memo(({ categoryId, categoryName, applicant, onBack }: CategoryQuestionsProps) => {
  const { projectId } = useParams();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [additionalFormData, setAdditionalFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track which fields have been touched by user to preserve their input
  const touchedFields = useRef<Set<string>>(new Set());
  
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
  } = useTypedChecklistItems(projectId!, categoryId, participantDesignation);

  // Enhanced category items filtering using proper database fields
  const categoryItems = useMemo(() => {
    return items
      .filter(item => {
        // Only include items from the current category
        if (item.categoryId !== categoryId) return false;
        
        // Use proper question classification logic
        return ChecklistItemService.isMainQuestion(item);
      })
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }, [items, categoryId]);

  // Stable item ID to form ID mapping
  const itemIdToFormIdMap = useMemo(() => {
    return categoryItems.reduce((map, item) => {
      map[item.itemId] = item.id;
      return map;
    }, {} as Record<string, string>);
  }, [categoryItems]);

  // Enhanced conditional logic hook
  const {
    additionalQuestions,
    loading: logicLoading,
    activeSubcategories,
    evaluateOnSave,
    loadExistingAdditionalQuestions,
  } = useConditionalLogic(
    projectId!,
    categoryId,
    participantDesignation
  );

  // Reset error boundary when conditional logic reloads
  const handleConditionalLogicReset = useCallback(() => {
    loadExistingAdditionalQuestions();
  }, [loadExistingAdditionalQuestions]);

  // Load existing conditional questions on mount
  useEffect(() => {
    if (projectId && categoryId) {
      loadExistingAdditionalQuestions();
    }
  }, [projectId, categoryId, loadExistingAdditionalQuestions]);

  // FIXED: Initialize form data only once and preserve user input
  useEffect(() => {
    if (categoryItems.length > 0 && !isInitialized) {
      console.log('🔧 INIT: Initializing form data for first time');
      const initialFormData: Record<string, any> = {};
      categoryItems.forEach(item => {
        if (item.displayValue && item.displayValue !== '') {
          initialFormData[item.id] = item.displayValue;
          console.log(`🔧 INIT: Setting initial value for ${item.itemName}:`, item.displayValue);
        }
      });
      setFormData(initialFormData);
      setIsInitialized(true);
    } else if (categoryItems.length > 0 && isInitialized) {
      // Smart merge: only update fields that haven't been touched by user
      console.log('🔧 MERGE: Smart merging new category items with existing form data');
      setFormData(prevFormData => {
        const mergedData = { ...prevFormData };
        let hasChanges = false;
        
        categoryItems.forEach(item => {
          const fieldId = item.id;
          const isFieldTouched = touchedFields.current.has(fieldId);
          const hasDisplayValue = item.displayValue && item.displayValue !== '';
          const fieldExists = fieldId in mergedData;
          
          // Only update if field hasn't been touched by user AND has a display value AND doesn't exist yet
          if (!isFieldTouched && hasDisplayValue && !fieldExists) {
            mergedData[fieldId] = item.displayValue;
            hasChanges = true;
            console.log(`🔧 MERGE: Adding new field ${item.itemName}:`, item.displayValue);
          }
        });
        
        return hasChanges ? mergedData : prevFormData;
      });
    }
  }, [categoryItems, isInitialized]);

  // Initialize additional form data with existing values
  useEffect(() => {
    const initialAdditionalFormData: Record<string, any> = {};
    additionalQuestions.forEach(item => {
      if (item.displayValue && item.displayValue !== '') {
        initialAdditionalFormData[item.id] = item.displayValue;
      }
    });
    setAdditionalFormData(initialAdditionalFormData);
  }, [additionalQuestions]);

  // FIXED: Enhanced input change handlers that track touched fields
  const handleInputChange = useCallback((itemId: string, value: any) => {
    console.log('🔧 INPUT: User input change for', itemId, ':', value);
    // Mark field as touched by user
    touchedFields.current.add(itemId);
    
    setFormData(prev => ({
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

  // Enhanced save handler with better error handling and user feedback
  const handleSave = useCallback(async () => {
    if (!projectId) return;

    try {
      setSaving(true);
      setSaveError(null);
      const savePromises = [];
      
      // Save main questions first
      for (const item of categoryItems) {
        const inputValue = formData[item.id];
        if (inputValue === undefined || inputValue === '') continue;

        const typedValue = validateAndConvertValue(item.itemType, inputValue);
        savePromises.push(updateItem(item.id, typedValue, 'submitted'));
      }

      await Promise.all(savePromises);
      
      // Show evaluation feedback
      toast.info('Evaluating conditional logic...', { duration: 2000 });
      
      console.log('Evaluating enhanced conditional logic after save...');
      const logicResult = await evaluateOnSave(formData, itemIdToFormIdMap);
      
      setHasUnsavedChanges(false);
      setLastSaveTime(new Date());
      
      toast.success('Answers saved successfully!', {
        description: `Saved at ${new Date().toLocaleTimeString()}`,
      });
      
      if (logicResult.subcategories.length > 0) {
        const preservedCount = Object.keys(logicResult.preservedAnswers || {}).length;
        toast.info(
          `${logicResult.subcategories.length} additional question section(s) unlocked!`,
          {
            description: preservedCount > 0 ? `${preservedCount} previous answers were preserved.` : undefined,
            duration: 5000,
          }
        );
      }
      
    } catch (error) {
      console.error('Error saving form data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save answers';
      setSaveError(errorMessage);
      toast.error('Failed to save answers', {
        description: 'Please check your internet connection and try again.',
      });
    } finally {
      setSaving(false);
    }
  }, [projectId, categoryItems, formData, itemIdToFormIdMap, validateAndConvertValue, updateItem, evaluateOnSave]);

  // Enhanced save handler for additional questions
  const handleSaveAdditional = useCallback(async () => {
    if (!projectId) return;

    try {
      setSaving(true);
      const savePromises = [];
      
      // Save additional questions
      for (const item of additionalQuestions) {
        const inputValue = additionalFormData[item.id];
        if (inputValue === undefined || inputValue === '') continue;

        const typedValue = validateAndConvertValue(item.itemType, inputValue);
        savePromises.push(updateItem(item.id, typedValue, 'submitted'));
      }

      await Promise.all(savePromises);
      toast.success('Additional answers saved successfully!');
      
    } catch (error) {
      console.error('Error saving additional form data:', error);
      toast.error('Failed to save additional answers. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [projectId, additionalQuestions, additionalFormData, validateAndConvertValue, updateItem]);

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
        
        <ConditionalLogicLoader message="Loading questions..." />
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
      
      <Tabs defaultValue="main-questions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="main-questions">
            Main Questions
            {hasUnsavedChanges && (
              <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                !
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="additional-questions">
            Additional Questions
            {additionalQuestions.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {additionalQuestions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="main-questions" className="mt-6">
          <MainQuestionsRenderer
            categoryItems={categoryItems}
            formData={formData}
            hasUnsavedChanges={hasUnsavedChanges}
            saveError={saveError}
            lastSaveTime={lastSaveTime}
            saving={saving}
            onInputChange={handleInputChange}
            onSave={handleSave}
          />
        </TabsContent>
        
        <TabsContent value="additional-questions" className="mt-6">
          <AdditionalQuestionsRenderer
            additionalQuestions={additionalQuestions}
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
          <div className="bg-muted/50 p-8 rounded-lg text-center">
            <p className="text-lg text-muted-foreground">
              Document management will be available here soon.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You'll be able to upload and manage required documents for this category.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

CategoryQuestions.displayName = 'CategoryQuestions';

export default CategoryQuestions;
