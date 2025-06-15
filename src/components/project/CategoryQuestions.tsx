
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import { useTypedChecklistItems } from '@/hooks/useTypedChecklistItems';
import { useParams } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

interface CategoryQuestionsProps {
  categoryName: string;
  applicant?: 'applicant_1' | 'applicant_2';
  onBack: () => void;
}

const CategoryQuestions = ({ categoryName, applicant, onBack }: CategoryQuestionsProps) => {
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
    createItem,
    updateItem,
    validateAndConvertValue,
  } = useTypedChecklistItems(projectId!, undefined, participantDesignation);

  // Filter items by category name (we'll need to get the category ID eventually)
  const categoryItems = items.filter(item => {
    // For now, we'll match by category name in the mock data structure
    // In a real implementation, this would filter by category_id
    return true; // Show all items for now since we don't have category filtering set up
  });

  const handleInputChange = (itemId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleSave = async () => {
    if (!projectId) return;

    try {
      for (const item of categoryItems) {
        const inputValue = formData[item.id];
        if (!inputValue) continue;

        // Validate and convert the value based on item type
        const typedValue = validateAndConvertValue(item.itemType, inputValue);

        // Update existing item
        await updateItem(item.id, typedValue, 'submitted');
      }
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  const renderQuestionInput = (item: typeof categoryItems[0]) => {
    const currentValue = formData[item.id] ?? item.displayValue ?? '';

    switch (item.itemType) {
      case 'text':
        return (
          <Input
            value={currentValue}
            onChange={(e) => handleInputChange(item.id, e.target.value)}
            placeholder="Enter text..."
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleInputChange(item.id, e.target.value)}
            placeholder="Enter number..."
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={currentValue}
            onChange={(e) => handleInputChange(item.id, e.target.value)}
          />
        );

      case 'single_choice_dropdown':
        return (
          <Select
            value={currentValue}
            onValueChange={(value) => handleInputChange(item.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'multiple_choice_checkbox':
        const selectedOptions = Array.isArray(currentValue) ? currentValue : [];
        const availableOptions = ['Option A', 'Option B', 'Option C']; // This should come from item_options table
        
        return (
          <div className="space-y-2">
            {availableOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${item.id}-${option}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValue = checked
                      ? [...selectedOptions, option]
                      : selectedOptions.filter((selectedOption: string) => selectedOption !== option);
                    handleInputChange(item.id, newValue);
                  }}
                />
                <Label htmlFor={`${item.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case 'document':
        return (
          <div className="space-y-2">
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Handle file upload here
                  handleInputChange(item.id, file.name);
                }
              }}
            />
            {currentValue && (
              <p className="text-sm text-muted-foreground">
                Current file: {currentValue}
              </p>
            )}
          </div>
        );

      default:
        return <div className="text-muted-foreground">Unsupported question type</div>;
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
            <div className="space-y-6">
              {categoryItems.map((item) => (
                <div key={item.id} className="space-y-2">
                  <Label className="text-base font-medium">
                    {item.itemName}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  {renderQuestionInput(item)}
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
