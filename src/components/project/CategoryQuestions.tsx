
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

// Mock questions for demonstration - these would come from required_items table
const MOCK_QUESTIONS = [
  {
    id: '1',
    item_name: 'Full Name',
    item_type: 'text' as const,
    category_name: 'La Casa',
    required: true,
  },
  {
    id: '2',
    item_name: 'Annual Income',
    item_type: 'number' as const,
    category_name: 'Professione',
    required: true,
  },
  {
    id: '3',
    item_name: 'Employment Start Date',
    item_type: 'date' as const,
    category_name: 'Professione',
    required: false,
  },
  {
    id: '4',
    item_name: 'Employment Type',
    item_type: 'single_choice_dropdown' as const,
    category_name: 'Professione',
    required: true,
    options: ['Full-time', 'Part-time', 'Contract', 'Self-employed'],
  },
  {
    id: '5',
    item_name: 'Additional Benefits',
    item_type: 'multiple_choice_checkbox' as const,
    category_name: 'Professione',
    required: false,
    options: ['Health Insurance', 'Retirement Plan', 'Bonus', 'Stock Options'],
  },
];

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

  // Filter questions by category
  const categoryQuestions = MOCK_QUESTIONS.filter(q => q.category_name === categoryName);

  const handleInputChange = (questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSave = async () => {
    if (!projectId) return;

    try {
      for (const question of categoryQuestions) {
        const inputValue = formData[question.id];
        if (!inputValue && question.required) continue;

        // Find existing item
        const existingItem = items.find(item => item.itemId === question.id);
        
        // Validate and convert the value based on item type
        const typedValue = validateAndConvertValue(question.item_type, inputValue);

        if (existingItem) {
          // Update existing item
          await updateItem(existingItem.id, typedValue, 'submitted');
        } else {
          // Create new item
          await createItem(question.id, typedValue);
        }
      }
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  const renderQuestionInput = (question: typeof MOCK_QUESTIONS[0]) => {
    const existingItem = items.find(item => item.itemId === question.id);
    const currentValue = formData[question.id] ?? (existingItem ? 
      existingItem.displayValue : '');

    switch (question.item_type) {
      case 'text':
        return (
          <Input
            value={currentValue}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Enter text..."
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Enter number..."
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={currentValue}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
          />
        );

      case 'single_choice_dropdown':
        return (
          <Select
            value={currentValue}
            onValueChange={(value) => handleInputChange(question.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiple_choice_checkbox':
        const selectedOptions = Array.isArray(currentValue) ? currentValue : [];
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValue = checked
                      ? [...selectedOptions, option]
                      : selectedOptions.filter((item: string) => item !== option);
                    handleInputChange(question.id, newValue);
                  }}
                />
                <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
              </div>
            ))}
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
      
      {categoryQuestions.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <div className="space-y-6">
              {categoryQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label className="text-base font-medium">
                    {question.item_name}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderQuestionInput(question)}
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
