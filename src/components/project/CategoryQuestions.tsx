
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { useTypedChecklistItems } from '@/hooks/useTypedChecklistItems';
import { useParams } from 'react-router-dom';
import { useItemOptions } from '@/hooks/useItemOptions';
import TextQuestion from './questions/TextQuestion';
import NumberQuestion from './questions/NumberQuestion';
import DateQuestion from './questions/DateQuestion';
import SingleChoiceQuestion from './questions/SingleChoiceQuestion';
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion';

interface CategoryQuestionsProps {
  categoryId: string;
  categoryName: string;
  applicant?: 'applicant_1' | 'applicant_2';
  onBack: () => void;
}

const CategoryQuestions = ({ categoryId, categoryName, applicant, onBack }: CategoryQuestionsProps) => {
  const { projectId } = useParams();
  const [formData, setFormData] = useState<Record<string, any>>({});
  
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

  // Filter and sort items by category and priority
  const categoryItems = items
    .filter(item => item.categoryId === categoryId)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));

  const handleInputChange = (itemId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleSave = async () => {
    if (!projectId) return;

    try {
      const savePromises = [];
      
      for (const item of categoryItems) {
        const inputValue = formData[item.id];
        if (inputValue === undefined || inputValue === '') continue;

        // Validate and convert the value based on item type
        const typedValue = validateAndConvertValue(item.itemType, inputValue);

        // Update existing item
        savePromises.push(updateItem(item.id, typedValue, 'submitted'));
      }

      await Promise.all(savePromises);
      
      // Clear form data after successful save
      setFormData({});
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  const QuestionComponent = ({ item }: { item: typeof categoryItems[0] }) => {
    const currentValue = formData[item.id] ?? item.displayValue ?? '';
    const { options } = useItemOptions(item.itemId);

    switch (item.itemType) {
      case 'text':
        return (
          <TextQuestion
            value={currentValue}
            onChange={(value) => handleInputChange(item.id, value)}
            required
          />
        );

      case 'number':
        return (
          <NumberQuestion
            value={currentValue}
            onChange={(value) => handleInputChange(item.id, value)}
            required
          />
        );

      case 'date':
        return (
          <DateQuestion
            value={currentValue}
            onChange={(value) => handleInputChange(item.id, value)}
            required
          />
        );

      case 'single_choice_dropdown':
        return (
          <SingleChoiceQuestion
            value={currentValue}
            onChange={(value) => handleInputChange(item.id, value)}
            options={options.map(opt => ({ value: opt.value, label: opt.label }))}
            required
          />
        );

      case 'multiple_choice_checkbox':
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        return (
          <MultipleChoiceQuestion
            value={selectedValues}
            onChange={(value) => handleInputChange(item.id, value)}
            options={options.map(opt => ({ value: opt.value, label: opt.label }))}
            required
          />
        );

      default:
        return <div className="text-muted-foreground">Unsupported question type: {item.itemType}</div>;
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
      
      {categoryItems.length > 0 ? (
        <div className="space-y-6">
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
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Answers
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 p-8 rounded-lg text-center">
          <p className="text-lg text-muted-foreground">
            No questions available for this category yet.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Questions will be automatically generated based on the project configuration.
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryQuestions;
