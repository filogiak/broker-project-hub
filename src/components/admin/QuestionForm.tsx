import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { questionService } from '@/services/questionService';
import QuestionOptionManager from './QuestionOptionManager';
import type { Database } from '@/integrations/supabase/types';

// Use the proper enum types from the database
type ProjectType = Database['public']['Enums']['project_type'];
type ItemType = Database['public']['Enums']['item_type'];
type ItemScope = Database['public']['Enums']['item_scope'];

// Updated interface to include all subcategory fields and initiators
interface QuestionFormData {
  item_name: string;
  answer_id?: string;
  category_id?: string;
  subcategory?: string;
  subcategory_2?: string;
  subcategory_3?: string;
  subcategory_4?: string;
  subcategory_5?: string;
  subcategory_1_initiator: boolean;
  subcategory_2_initiator: boolean;
  subcategory_3_initiator: boolean;
  subcategory_4_initiator: boolean;
  subcategory_5_initiator: boolean;
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

// All project types as default array
const ALL_PROJECT_TYPES: ProjectType[] = PROJECT_TYPE_OPTIONS.map(option => option.value as ProjectType);

const QuestionForm = ({ onSuccess, editingQuestion, onCancel }: QuestionFormProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [selectedItemType, setSelectedItemType] = useState<ItemType>('text');
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<ProjectType[]>(ALL_PROJECT_TYPES);
  const [isEditMode, setIsEditMode] = useState(false);

  const form = useForm<QuestionFormData>({
    defaultValues: {
      item_name: '',
      answer_id: '',
      category_id: undefined,
      subcategory: '',
      subcategory_2: '',
      subcategory_3: '',
      subcategory_4: '',
      subcategory_5: '',
      subcategory_1_initiator: false,
      subcategory_2_initiator: false,
      subcategory_3_initiator: false,
      subcategory_4_initiator: false,
      subcategory_5_initiator: false,
      priority: 0,
      scope: 'PROJECT',
      item_type: 'text',
      project_types_applicable: ALL_PROJECT_TYPES,
      validation_rules: {}
    }
  });

  // Effect 1: Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Effect 2: Initialize form data after categories are loaded
  useEffect(() => {
    // Only proceed if categories are loaded
    if (!categoriesLoaded) return;

    if (editingQuestion) {
      setIsEditMode(true);
      const editProjectTypes = editingQuestion.project_types_applicable || [];
      
      // Validate that the category still exists
      const categoryExists = categories.some(cat => cat.id === editingQuestion.category_id);
      
      form.reset({
        item_name: editingQuestion.item_name,
        answer_id: editingQuestion.answer_id || '',
        category_id: categoryExists ? editingQuestion.category_id : undefined,
        subcategory: editingQuestion.subcategory || '',
        subcategory_2: editingQuestion.subcategory_2 || '',
        subcategory_3: editingQuestion.subcategory_3 || '',
        subcategory_4: editingQuestion.subcategory_4 || '',
        subcategory_5: editingQuestion.subcategory_5 || '',
        subcategory_1_initiator: editingQuestion.subcategory_1_initiator || false,
        subcategory_2_initiator: editingQuestion.subcategory_2_initiator || false,
        subcategory_3_initiator: editingQuestion.subcategory_3_initiator || false,
        subcategory_4_initiator: editingQuestion.subcategory_4_initiator || false,
        subcategory_5_initiator: editingQuestion.subcategory_5_initiator || false,
        priority: editingQuestion.priority || 0,
        scope: editingQuestion.scope,
        item_type: editingQuestion.item_type,
        project_types_applicable: editProjectTypes,
        validation_rules: editingQuestion.validation_rules || {}
      });
      
      setSelectedItemType(editingQuestion.item_type);
      setSelectedProjectTypes(editProjectTypes);
      
      if (editingQuestion.item_options) {
        setOptions(editingQuestion.item_options);
      }
      
      // Log for debugging
      console.log('Edit mode initialized:', {
        categoryId: editingQuestion.category_id,
        categoryExists,
        categories: categories.length
      });
    } else {
      // New question mode - use all project types as default
      setIsEditMode(false);
      setSelectedProjectTypes(ALL_PROJECT_TYPES);
      form.setValue('project_types_applicable', ALL_PROJECT_TYPES);
      
      // Reset form to defaults for new question
      form.reset({
        item_name: '',
        answer_id: '',
        category_id: undefined,
        subcategory: '',
        subcategory_2: '',
        subcategory_3: '',
        subcategory_4: '',
        subcategory_5: '',
        subcategory_1_initiator: false,
        subcategory_2_initiator: false,
        subcategory_3_initiator: false,
        subcategory_4_initiator: false,
        subcategory_5_initiator: false,
        priority: 0,
        scope: 'PROJECT',
        item_type: 'text',
        project_types_applicable: ALL_PROJECT_TYPES,
        validation_rules: {}
      });
      setOptions([]);
    }
  }, [editingQuestion, categoriesLoaded, categories, form]);

  const loadCategories = async () => {
    try {
      const data = await questionService.getItemsCategories();
      setCategories(data);
      setCategoriesLoaded(true);
      console.log('Categories loaded:', data.length);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
      setCategoriesLoaded(true); // Set to true even on error to prevent infinite loading
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
      
      // Validate that subcategory initiators have corresponding subcategory values
      const subcategoryValidationErrors = [];
      if (data.subcategory_1_initiator && !data.subcategory?.trim()) {
        subcategoryValidationErrors.push('Subcategory 1 must have a value when marked as initiator');
      }
      if (data.subcategory_2_initiator && !data.subcategory_2?.trim()) {
        subcategoryValidationErrors.push('Subcategory 2 must have a value when marked as initiator');
      }
      if (data.subcategory_3_initiator && !data.subcategory_3?.trim()) {
        subcategoryValidationErrors.push('Subcategory 3 must have a value when marked as initiator');
      }
      if (data.subcategory_4_initiator && !data.subcategory_4?.trim()) {
        subcategoryValidationErrors.push('Subcategory 4 must have a value when marked as initiator');
      }
      if (data.subcategory_5_initiator && !data.subcategory_5?.trim()) {
        subcategoryValidationErrors.push('Subcategory 5 must have a value when marked as initiator');
      }

      if (subcategoryValidationErrors.length > 0) {
        toast.error(subcategoryValidationErrors.join('. '));
        return;
      }
      
      // Convert empty string subcategories to null before saving
      const sanitizedData = {
        ...data,
        subcategory: data.subcategory?.trim() || null,
        subcategory_2: data.subcategory_2?.trim() || null,
        subcategory_3: data.subcategory_3?.trim() || null,
        subcategory_4: data.subcategory_4?.trim() || null,
        subcategory_5: data.subcategory_5?.trim() || null,
      };
      
      let questionId: string;
      
      if (editingQuestion) {
        const updated = await questionService.updateRequiredItem(editingQuestion.id, sanitizedData);
        questionId = updated.id;
      } else {
        const created = await questionService.createRequiredItem(sanitizedData);
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

  // Get active initiator count for display
  const getActiveInitiatorCount = () => {
    const formValues = form.getValues();
    let count = 0;
    if (formValues.subcategory_1_initiator) count++;
    if (formValues.subcategory_2_initiator) count++;
    if (formValues.subcategory_3_initiator) count++;
    if (formValues.subcategory_4_initiator) count++;
    if (formValues.subcategory_5_initiator) count++;
    return count;
  };

  // Don't render the form until categories are loaded
  if (!categoriesLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-muted-foreground">Loading categories...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                  <FormLabel>Question Label</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter the question text shown to users" />
                  </FormControl>
                  <FormDescription>
                    This is the label that users will see when answering this question
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer ID (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter a unique identifier for this question" />
                  </FormControl>
                  <FormDescription>
                    A unique identifier to help recognize and select this question internally
                  </FormDescription>
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
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ''}
                  >
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

            {/* Enhanced Subcategory Section */}
            <Card className="border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Conditional Logic Subcategories
                  {getActiveInitiatorCount() > 0 && (
                    <Badge variant="secondary">
                      {getActiveInitiatorCount()} initiator{getActiveInitiatorCount() > 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
                <FormDescription>
                  Set up subcategories that can be triggered by different answer values. Use the Logic Rules Manager to define which answers trigger which subcategories.
                </FormDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subcategory 1 */}
                <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory 1</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional subcategory" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subcategory_1_initiator"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Initiator</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Subcategory 2 */}
                <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
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
                  <FormField
                    control={form.control}
                    name="subcategory_2_initiator"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Initiator</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Subcategory 3 */}
                <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="subcategory_3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory 3</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional third subcategory" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subcategory_3_initiator"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Initiator</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Subcategory 4 */}
                <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="subcategory_4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory 4</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional fourth subcategory" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subcategory_4_initiator"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Initiator</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Subcategory 5 */}
                <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="subcategory_5"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory 5</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional fifth subcategory" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subcategory_5_initiator"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Initiator</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

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
                    onValueChange={(value: ItemType) => {
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
