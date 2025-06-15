import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { questionService } from '@/services/questionService';
import QuestionOptionManager from './QuestionOptionManager';
import type { Database } from '@/integrations/supabase/types';

// Use the proper enum types from the database
type ProjectType = Database['public']['Enums']['project_type'];
type ItemType = Database['public']['Enums']['item_type'];
type ItemScope = Database['public']['Enums']['item_scope'];

// Simplified interfaces to avoid TypeScript deep instantiation issues
interface QuestionFormData {
  item_name: string;
  category_id?: string;
  subcategory?: string;
  subcategory_2?: string;
  priority: number;
  scope: ItemScope;
  item_type: ItemType;
  project_types_applicable: ProjectType[];
  validation_rules: Record<string, any>;
}

interface QuestionOption {
  id?: string;
  option_value: string;
  option_label: string;
  display_order: number;
}

interface QuestionFormProps {
  onSuccess: () => void;
  editingQuestion?: any;
  onCancel?: () => void;
}

const ITEM_TYPE_OPTIONS = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'date', label: 'Date Input' },
  { value: 'document', label: 'Document Upload' },
  { value: 'repeatable_group', label: 'Repeatable Group' },
  { value: 'single_choice_dropdown', label: 'Single Choice Dropdown' },
  { value: 'multiple_choice_checkbox', label: 'Multiple Choice Checkbox' }
] as const;

const SCOPE_OPTIONS = [
  { value: 'PROJECT', label: 'Project Level' },
  { value: 'PARTICIPANT', label: 'Participant Level' }
] as const;

const PROJECT_TYPE_OPTIONS = [
  { value: 'first_home_purchase', label: 'First Home Purchase' },
  { value: 'refinance', label: 'Refinance' },
  { value: 'investment_property', label: 'Investment Property' },
  { value: 'construction_loan', label: 'Construction Loan' },
  { value: 'home_equity_loan', label: 'Home Equity Loan' },
  { value: 'reverse_mortgage', label: 'Reverse Mortgage' }
] as const;

const QuestionForm = ({ onSuccess, editingQuestion, onCancel }: QuestionFormProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [selectedItemType, setSelectedItemType] = useState<ItemType>('text');
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<ProjectType[]>([]);

  const form = useForm<QuestionFormData>({
    defaultValues: {
      item_name: '',
      category_id: undefined,
      subcategory: '',
      subcategory_2: '',
      priority: 0,
      scope: 'PROJECT',
      item_type: 'text',
      project_types_applicable: [],
      validation_rules: {}
    }
  });

  useEffect(() => {
    loadCategories();
    if (editingQuestion) {
      form.reset({
        item_name: editingQuestion.item_name,
        category_id: editingQuestion.category_id,
        subcategory: editingQuestion.subcategory || '',
        subcategory_2: editingQuestion.subcategory_2 || '',
        priority: editingQuestion.priority || 0,
        scope: editingQuestion.scope,
        item_type: editingQuestion.item_type,
        project_types_applicable: editingQuestion.project_types_applicable || [],
        validation_rules: editingQuestion.validation_rules || {}
      });
      setSelectedItemType(editingQuestion.item_type);
      setSelectedProjectTypes(editingQuestion.project_types_applicable || []);
      if (editingQuestion.item_options) {
        setOptions(editingQuestion.item_options);
      }
    }
  }, [editingQuestion, form]);

  const loadCategories = async () => {
    try {
      const data = await questionService.getItemsCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  // Validate options before saving
  const validateOptions = (options: QuestionOption[]): string | null => {
    if (options.length === 0) {
      return 'At least one option is required for dropdown and checkbox questions';
    }

    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (!option.option_value?.trim()) {
        return `Option ${i + 1} is missing a value`;
      }
      if (!option.option_label?.trim()) {
        return `Option ${i + 1} is missing a label`;
      }
    }

    return null;
  };

  const handleSubmit = async (data: QuestionFormData) => {
    try {
      setLoading(true);
      
      // Validate options for dropdown/checkbox types
      if (data.item_type === 'single_choice_dropdown' || data.item_type === 'multiple_choice_checkbox') {
        const validationError = validateOptions(options);
        if (validationError) {
          toast.error(validationError);
          return;
        }
      }
      
      let questionId: string;
      
      if (editingQuestion) {
        const updated = await questionService.updateRequiredItem(editingQuestion.id, data);
        questionId = updated.id;
      } else {
        const created = await questionService.createRequiredItem(data);
        questionId = created.id;
      }

      // Handle options for dropdown/checkbox types
      if (data.item_type === 'single_choice_dropdown' || data.item_type === 'multiple_choice_checkbox') {
        // Filter out incomplete options and prepare for database
        const validOptions = options
          .filter(option => option.option_value?.trim() && option.option_label?.trim())
          .map(option => ({
            option_value: option.option_value.trim(),
            option_label: option.option_label.trim(),
            display_order: option.display_order
          }));

        if (validOptions.length > 0) {
          await questionService.replaceItemOptions(questionId, validOptions);
        }
      }

      toast.success(editingQuestion ? 'Question updated successfully' : 'Question created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectTypeChange = (projectType: ProjectType, checked: boolean) => {
    const updated = checked 
      ? [...selectedProjectTypes, projectType]
      : selectedProjectTypes.filter(type => type !== projectType);
    
    setSelectedProjectTypes(updated);
    form.setValue('project_types_applicable', updated);
  };

  const handleOptionsChange = (newOptions: QuestionOption[]) => {
    setOptions(newOptions);
  };

  const showOptionsManager = selectedItemType === 'single_choice_dropdown' || selectedItemType === 'multiple_choice_checkbox';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingQuestion ? 'Edit Question' : 'Create New Question'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter the question text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional subcategory" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategory_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory 2</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional second subcategory" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormDescription>Higher numbers = higher priority</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SCOPE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="item_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Type</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedItemType(value);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ITEM_TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label className="text-base font-medium">Applicable Project Types</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {PROJECT_TYPE_OPTIONS.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={selectedProjectTypes.includes(option.value as ProjectType)}
                      onCheckedChange={(checked) => 
                        handleProjectTypeChange(option.value as ProjectType, checked as boolean)
                      }
                    />
                    <Label htmlFor={option.value} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {showOptionsManager && (
              <QuestionOptionManager
                options={options}
                onChange={handleOptionsChange}
              />
            )}

            <div className="flex justify-end gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (editingQuestion ? 'Update Question' : 'Create Question')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
