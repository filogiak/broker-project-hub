import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTypedChecklistItems } from '@/hooks/useTypedChecklistItems';
import { useParams } from 'react-router-dom';
import { useItemOptions } from '@/hooks/useItemOptions';
import { useConditionalLogic } from '@/hooks/useConditionalLogic';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ConditionalLogicErrorBoundary from './ConditionalLogicErrorBoundary';
import ConditionalLogicLoader from './ConditionalLogicLoader';
import TextQuestion from './questions/TextQuestion';
import NumberQuestion from './questions/NumberQuestion';
import DateQuestion from './questions/DateQuestion';
import SingleChoiceQuestion from './questions/SingleChoiceQuestion';
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion';
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

  // Stable memoized category items
  const categoryItems = useMemo(() => {
    return items
      .filter(item => item.categoryId === categoryId && !item.typedValue.textValue?.includes('subcategory'))
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

  // Initialize form data with existing values
  useEffect(() => {
    const initialFormData: Record<string, any> = {};
    categoryItems.forEach(item => {
      if (item.displayValue && item.displayValue !== '') {
        initialFormData[item.id] = item.displayValue;
      }
    });
    setFormData(initialFormData);
  }, [categoryItems]);

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

  // Stable input change handlers
  const handleInputChange = useCallback((itemId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: value,
    }));
    setHasUnsavedChanges(true);
    setSaveError(null); // Clear any previous errors
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

  // Memoized question component with stable references
  const QuestionComponent = React.memo(({ item, isAdditional = false }: { 
    item: typeof categoryItems[0]; 
    isAdditional?: boolean 
  }) => {
    const currentValue = isAdditional 
      ? (additionalFormData[item.id] ?? item.displayValue ?? '')
      : (formData[item.id] ?? item.displayValue ?? '');
    
    const { options, loading: optionsLoading } = useItemOptions(item.itemId);
    const onChange = isAdditional ? handleAdditionalInputChange : handleInputChange;

    const handleChange = useCallback((value: any) => {
      onChange(item.id, value);
    }, [item.id, onChange]);

    switch (item.itemType) {
      case 'text':
        return (
          <TextQuestion
            value={currentValue}
            onChange={handleChange}
            required
          />
        );

      case 'number':
        return (
          <NumberQuestion
            value={currentValue}
            onChange={handleChange}
            required
          />
        );

      case 'date':
        return (
          <DateQuestion
            value={currentValue}
            onChange={handleChange}
            required
          />
        );

      case 'single_choice_dropdown':
        return (
          <SingleChoiceQuestion
            value={currentValue}
            onChange={handleChange}
            options={options.map(opt => ({ value: opt.value, label: opt.label }))}
            disabled={optionsLoading}
            required
          />
        );

      case 'multiple_choice_checkbox':
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        return (
          <MultipleChoiceQuestion
            value={selectedValues}
            onChange={handleChange}
            options={options.map(opt => ({ value: opt.value, label: opt.label }))}
            required
          />
        );

      default:
        return <div className="text-muted-foreground">Unsupported question type: {item.itemType}</div>;
    }
  });

  // Enhanced MainQuestionsContent with better status indicators
  const MainQuestionsContent = useCallback(() => {
    if (categoryItems.length > 0) {
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
              {categoryItems.map((item, index) => (
                <div key={item.id} className="space-y-3">
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
                    <QuestionComponent item={item} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Answers'}
            </Button>
          </div>
        </div>
      );
    } else {
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
  }, [categoryItems, handleSave, saving, hasUnsavedChanges, saveError, lastSaveTime]);

  // Enhanced AdditionalQuestionsContent with error boundary
  const AdditionalQuestionsContent = useCallback(() => {
    if (logicLoading) {
      return <ConditionalLogicLoader isEvaluating={true} />;
    }

    if (additionalQuestions.length > 0) {
      return (
        <ConditionalLogicErrorBoundary onReset={handleConditionalLogicReset}>
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
                {additionalQuestions.map((item, index) => (
                  <div key={item.id} className="space-y-3">
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
                      <QuestionComponent item={item} isAdditional={true} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveAdditional} 
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
    } else {
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
  }, [logicLoading, additionalQuestions, activeSubcategories, handleSaveAdditional, saving, handleConditionalLogicReset]);

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
          <MainQuestionsContent />
        </TabsContent>
        
        <TabsContent value="additional-questions" className="mt-6">
          <AdditionalQuestionsContent />
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
