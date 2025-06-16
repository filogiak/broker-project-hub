
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save } from 'lucide-react';
import { useTypedChecklistItems } from '@/hooks/useTypedChecklistItems';
import { useParams } from 'react-router-dom';
import { useItemOptions } from '@/hooks/useItemOptions';
import { useConditionalLogic } from '@/hooks/useConditionalLogic';
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

const CategoryQuestions = ({ categoryId, categoryName, applicant, onBack }: CategoryQuestionsProps) => {
  const { projectId } = useParams();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [additionalFormData, setAdditionalFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  
  const participantDesignation = applicant === 'applicant_1' 
    ? 'applicant_one' as const
    : applicant === 'applicant_2' 
    ? 'applicant_two' as const
    : 'solo_applicant' as const;

  const {
    items,
    loading,
    updateItem,
    validateAndConvertValue,
  } = useTypedChecklistItems(projectId!, categoryId, participantDesignation);

  // Memoize category items to prevent re-renders
  const categoryItems = useMemo(() => {
    return items
      .filter(item => item.categoryId === categoryId && !item.typedValue.textValue?.includes('subcategory'))
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }, [items, categoryId]);

  // Memoize the item ID to form ID mapping to prevent re-renders
  const itemIdToFormIdMap = useMemo(() => {
    return categoryItems.reduce((map, item) => {
      map[item.itemId] = item.id;
      return map;
    }, {} as Record<string, string>);
  }, [categoryItems]);

  // Use conditional logic hook with save-triggered evaluation
  const {
    additionalQuestions,
    loading: logicLoading,
    activeSubcategories,
    evaluateOnSave,
  } = useConditionalLogic(
    projectId!,
    categoryId,
    participantDesignation
  );

  // Stable input change handlers to prevent component re-renders
  const handleInputChange = useCallback((itemId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: value,
    }));
  }, []);

  const handleAdditionalInputChange = useCallback((itemId: string, value: any) => {
    setAdditionalFormData(prev => ({
      ...prev,
      [itemId]: value,
    }));
  }, []);

  const handleSave = async () => {
    if (!projectId) return;

    try {
      setSaving(true);
      const savePromises = [];
      
      // Save main questions first
      for (const item of categoryItems) {
        const inputValue = formData[item.id];
        if (inputValue === undefined || inputValue === '') continue;

        const typedValue = validateAndConvertValue(item.itemType, inputValue);
        savePromises.push(updateItem(item.id, typedValue, 'submitted'));
      }

      await Promise.all(savePromises);
      
      // Now evaluate conditional logic based on saved data
      console.log('Evaluating conditional logic after save...');
      const logicResult = await evaluateOnSave(formData, itemIdToFormIdMap);
      
      // Clear main form data after successful save
      setFormData({});
      
      toast.success('Answers saved successfully!');
      
      if (logicResult.subcategories.length > 0) {
        toast.info(`${logicResult.subcategories.length} additional question section(s) unlocked based on your answers.`);
      }
      
    } catch (error) {
      console.error('Error saving form data:', error);
      toast.error('Failed to save answers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAdditional = async () => {
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
      setAdditionalFormData({});
      toast.success('Additional answers saved successfully!');
      
    } catch (error) {
      console.error('Error saving additional form data:', error);
      toast.error('Failed to save additional answers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Memoized question component to prevent unnecessary re-renders
  const QuestionComponent = React.memo(({ item, isAdditional = false }: { item: typeof categoryItems[0]; isAdditional?: boolean }) => {
    const currentValue = isAdditional 
      ? (additionalFormData[item.id] ?? item.displayValue ?? '')
      : (formData[item.id] ?? item.displayValue ?? '');
    const { options } = useItemOptions(item.itemId);
    const onChange = isAdditional ? handleAdditionalInputChange : handleInputChange;

    switch (item.itemType) {
      case 'text':
        return (
          <TextQuestion
            value={currentValue}
            onChange={(value) => onChange(item.id, value)}
            required
          />
        );

      case 'number':
        return (
          <NumberQuestion
            value={currentValue}
            onChange={(value) => onChange(item.id, value)}
            required
          />
        );

      case 'date':
        return (
          <DateQuestion
            value={currentValue}
            onChange={(value) => onChange(item.id, value)}
            required
          />
        );

      case 'single_choice_dropdown':
        return (
          <SingleChoiceQuestion
            value={currentValue}
            onChange={(value) => onChange(item.id, value)}
            options={options.map(opt => ({ value: opt.value, label: opt.label }))}
            required
          />
        );

      case 'multiple_choice_checkbox':
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        return (
          <MultipleChoiceQuestion
            value={selectedValues}
            onChange={(value) => onChange(item.id, value)}
            options={options.map(opt => ({ value: opt.value, label: opt.label }))}
            required
          />
        );

      default:
        return <div className="text-muted-foreground">Unsupported question type: {item.itemType}</div>;
    }
  });

  const MainQuestionsContent = () => {
    if (categoryItems.length > 0) {
      return (
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <div className="space-y-8">
              {categoryItems.map((item, index) => (
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
                    <QuestionComponent item={item} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving}
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
  };

  const AdditionalQuestionsContent = () => {
    if (logicLoading) {
      return (
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading additional questions...</p>
        </div>
      );
    }

    if (additionalQuestions.length > 0) {
      return (
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
  };

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
        
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading questions...</p>
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
      
      {/* Tabs Section */}
      <Tabs defaultValue="main-questions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="main-questions">Main Questions</TabsTrigger>
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
};

export default CategoryQuestions;
