
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { useTypedChecklistItems } from '@/hooks/useTypedChecklistItems';
import { useParams } from 'react-router-dom';
import QuestionRenderer from './questions/QuestionRenderer';
import DocumentUploadQuestion from './questions/DocumentUploadQuestion';
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
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  
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

  // Remove the redundant filtering - the hook already filters by categoryId
  // Just sort the items by priority
  const categoryItems = useMemo(() => {
    console.log('Raw items from hook:', items);
    console.log('CategoryId filter:', categoryId);
    
    // The hook should already return filtered items, but let's be safe
    const filtered = items.filter(item => {
      console.log('Item categoryId:', item.categoryId, 'Target categoryId:', categoryId);
      return item.categoryId === categoryId;
    });
    
    console.log('Filtered items:', filtered);
    
    return filtered.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }, [items, categoryId]);

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

  const handleInputChange = useCallback((itemId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: value,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!projectId) return;

    try {
      setSaving(true);
      const savePromises = [];
      
      for (const item of categoryItems) {
        const inputValue = formData[item.id];
        if (inputValue === undefined || inputValue === '') continue;

        const typedValue = validateAndConvertValue(item.itemType as Database['public']['Enums']['item_type'], inputValue);
        savePromises.push(updateItem(item.id, typedValue, 'submitted'));
      }

      await Promise.all(savePromises);
      
      toast.success('Answers saved successfully!', {
        description: `Saved at ${new Date().toLocaleTimeString()}`,
      });
      
    } catch (error) {
      console.error('Error saving form data:', error);
      toast.error('Failed to save answers', {
        description: 'Please check your internet connection and try again.',
      });
    } finally {
      setSaving(false);
    }
  }, [projectId, categoryItems, formData, validateAndConvertValue, updateItem]);

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

  console.log('Final categoryItems to render:', categoryItems);

  if (categoryItems.length === 0) {
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
        
        <div className="bg-muted/50 p-8 rounded-lg text-center">
          <p className="text-lg text-muted-foreground">
            No questions available for this category yet.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Debug info: Category ID: {categoryId}, Participant: {participantDesignation}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Answers'}
        </Button>
      </div>
      
      <div className="bg-card p-6 rounded-lg border">
        <div className="space-y-8">
          {categoryItems.map((item, index) => {
            const currentValue = formData[item.id] ?? item.displayValue ?? '';
            
            return (
              <div key={item.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <Label className="text-base font-medium leading-relaxed">
                    {index + 1}. {item.itemName}
                    {item.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Priority: {item.priority || 0}
                  </span>
                </div>
                
                <div className="ml-0">
                  {item.itemType === 'document' ? (
                    <DocumentUploadQuestion
                      question={item}
                      value={currentValue}
                      onChange={(value) => handleInputChange(item.id, value)}
                      projectId={projectId!}
                      participantDesignation={item.participantDesignation}
                    />
                  ) : (
                    <QuestionRenderer
                      item={item}
                      currentValue={currentValue}
                      onChange={handleInputChange}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

CategoryQuestions.displayName = 'CategoryQuestions';

export default CategoryQuestions;
