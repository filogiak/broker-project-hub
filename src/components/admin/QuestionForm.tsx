
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

type RequiredItemInsert = Database['public']['Tables']['required_items']['Insert'];
type ItemType = Database['public']['Enums']['item_type'];
type ItemScope = Database['public']['Enums']['item_scope'];
type ProjectType = Database['public']['Enums']['project_type'];

interface QuestionFormProps {
  onSuccess: () => void;
  editingQuestion?: any;
  onCancel?: () => void;
}

const ITEM_TYPE_OPTIONS: { value: ItemType; label: string }[] = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'date', label: 'Date Input' },
  { value: 'document', label: 'Document Upload' },
  { value: 'repeatable_group', label: 'Repeatable Group' },
  { value: 'single_choice_dropdown', label: 'Single Choice Dropdown' },
  { value: 'multiple_choice_checkbox', label: 'Multiple Choice Checkbox' }
];

const SCOPE_OPTIONS: { value: ItemScope; label: string }[] = [
  { value: 'PROJECT', label: 'Project Level' },
  { value: 'PARTICIPANT', label: 'Participant Level' }
];

const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'first_home_purchase', label: 'First Home Purchase' },
  { value: 'refinance', label: 'Refinance' },
  { value: 'investment_property', label: 'Investment Property' },
  { value: 'construction_loan', label: 'Construction Loan' },
  { value: 'home_equity_loan', label: 'Home Equity Loan' },
  { value: 'reverse_mortgage', label: 'Reverse Mortgage' }
];

const QuestionForm = ({ onSuccess, editingQuestion, onCancel }: QuestionFormProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [selectedItemType, setSelectedItemType] = useState<ItemType>('text');
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<ProjectType[]>([]);

  const form = useForm<RequiredItemInsert>({
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
      // Populate form with editing data
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
      const data = await questionService.getDocumentCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleSubmit = async (data: RequiredItemInsert) => {
    try {
      setLoading(true);
      
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
        await questionService.replaceItemOptions(questionId, options);
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
                      checked={selectedProjectTypes.includes(option.value)}
                      onCheckedChange={(checked) => 
                        handleProjectTypeChange(option.value, checked as boolean)
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
                onChange={setOptions}
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
