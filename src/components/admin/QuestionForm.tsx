
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { questionService } from '@/services/questionService';
import QuestionOptionManager from './QuestionOptionManager';

interface QuestionFormProps {
  question?: any;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  answer_id: string;
  item_name: string;
  item_type: string;
  category_id: string;
  subcategory: string | null;
  subcategory_2: string | null;
  subcategory_3: string | null;
  subcategory_4: string | null;
  subcategory_5: string | null;
  subcategory_1_initiator: boolean;
  subcategory_2_initiator: boolean;
  subcategory_3_initiator: boolean;
  subcategory_4_initiator: boolean;
  subcategory_5_initiator: boolean;
  display_order: number;
  help_text: string;
  placeholder_text: string;
  required: boolean;
  participant_designation: string;
  repeatable_group_title: string | null;
  repeatable_group_subtitle: string | null;
  repeatable_group_top_button_text: string | null;
  repeatable_group_start_button_text: string | null;
  repeatable_group_target_table: 'project_secondary_incomes' | 'project_dependents' | 'project_debts' | null;
}

const QuestionForm = ({ question, onSave, onCancel }: QuestionFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    answer_id: question?.answer_id || '',
    item_name: question?.item_name || '',
    item_type: question?.item_type || 'text',
    category_id: question?.category_id || '',
    subcategory: question?.subcategory || null,
    subcategory_2: question?.subcategory_2 || null,
    subcategory_3: question?.subcategory_3 || null,
    subcategory_4: question?.subcategory_4 || null,
    subcategory_5: question?.subcategory_5 || null,
    subcategory_1_initiator: question?.subcategory_1_initiator || false,
    subcategory_2_initiator: question?.subcategory_2_initiator || false,
    subcategory_3_initiator: question?.subcategory_3_initiator || false,
    subcategory_4_initiator: question?.subcategory_4_initiator || false,
    subcategory_5_initiator: question?.subcategory_5_initiator || false,
    display_order: question?.display_order || 0,
    help_text: question?.help_text || '',
    placeholder_text: question?.placeholder_text || '',
    required: question?.required || false,
    participant_designation: question?.participant_designation || 'solo_applicant',
    repeatable_group_title: question?.repeatable_group_title || null,
    repeatable_group_subtitle: question?.repeatable_group_subtitle || null,
    repeatable_group_top_button_text: question?.repeatable_group_top_button_text || null,
    repeatable_group_start_button_text: question?.repeatable_group_start_button_text || null,
    repeatable_group_target_table: question?.repeatable_group_target_table || null,
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await questionService.getItemsCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Failed to load categories');
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (question) {
      setFormData({
        answer_id: question.answer_id || '',
        item_name: question.item_name || '',
        item_type: question.item_type || 'text',
        category_id: question.category_id || '',
        subcategory: question.subcategory || null,
        subcategory_2: question.subcategory_2 || null,
        subcategory_3: question.subcategory_3 || null,
        subcategory_4: question.subcategory_4 || null,
        subcategory_5: question.subcategory_5 || null,
        subcategory_1_initiator: question.subcategory_1_initiator || false,
        subcategory_2_initiator: question.subcategory_2_initiator || false,
        subcategory_3_initiator: question.subcategory_3_initiator || false,
        subcategory_4_initiator: question.subcategory_4_initiator || false,
        subcategory_5_initiator: question.subcategory_5_initiator || false,
        display_order: question.display_order || 0,
        help_text: question.help_text || '',
        placeholder_text: question.placeholder_text || '',
        required: question.required || false,
        participant_designation: question.participant_designation || 'solo_applicant',
        repeatable_group_title: question.repeatable_group_title || null,
        repeatable_group_subtitle: question.repeatable_group_subtitle || null,
        repeatable_group_top_button_text: question.repeatable_group_top_button_text || null,
        repeatable_group_start_button_text: question.repeatable_group_start_button_text || null,
        repeatable_group_target_table: question.repeatable_group_target_table || null,
      });
    }
  }, [question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.item_name.trim()) {
      toast.error('Question name is required');
      return;
    }

    if (!formData.answer_id.trim()) {
      toast.error('Answer ID is required');
      return;
    }

    if (!formData.category_id) {
      toast.error('Category is required');
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        // Ensure item_type is properly typed
        item_type: formData.item_type as 'text' | 'number' | 'date' | 'single_choice_dropdown' | 'multiple_choice_checkbox' | 'document' | 'repeatable_group',
        // Convert empty strings to null for subcategory fields
        subcategory: formData.subcategory?.trim() || null,
        subcategory_2: formData.subcategory_2?.trim() || null,
        subcategory_3: formData.subcategory_3?.trim() || null,
        subcategory_4: formData.subcategory_4?.trim() || null,
        subcategory_5: formData.subcategory_5?.trim() || null,
        // Handle repeatable group fields
        repeatable_group_title: formData.repeatable_group_title?.trim() || null,
        repeatable_group_subtitle: formData.repeatable_group_subtitle?.trim() || null,
        repeatable_group_top_button_text: formData.repeatable_group_top_button_text?.trim() || null,
        repeatable_group_start_button_text: formData.repeatable_group_start_button_text?.trim() || null,
        repeatable_group_target_table: formData.repeatable_group_target_table || null,
      };

      if (question) {
        await questionService.updateRequiredItem(question.id, submitData);
        toast.success('Question updated successfully');
      } else {
        await questionService.createRequiredItem(submitData);
        toast.success('Question created successfully');
      }

      onSave();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{question ? 'Edit Question' : 'Create New Question'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Question Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="answer_id">Answer ID *</Label>
              <Input
                id="answer_id"
                value={formData.answer_id}
                onChange={(e) => setFormData({ ...formData, answer_id: e.target.value })}
                placeholder="Enter answer ID"
                required
              />
            </div>

            <div>
              <Label htmlFor="item_name">Question Name *</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                placeholder="Enter question name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item_type">Question Type *</Label>
              <Select
                value={formData.item_type}
                onValueChange={(value) => setFormData({ ...formData, item_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="single_choice_dropdown">Single Choice (Dropdown)</SelectItem>
                  <SelectItem value="multiple_choice_checkbox">Multiple Choice (Checkbox)</SelectItem>
                  <SelectItem value="document">Document Upload</SelectItem>
                  <SelectItem value="repeatable_group">Repeatable Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category_id">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Repeatable Group Configuration - Only show when item_type is 'repeatable_group' */}
          {formData.item_type === 'repeatable_group' && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-medium mb-4">Repeatable Group Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="repeatable_group_title">Group Title *</Label>
                  <Input
                    id="repeatable_group_title"
                    value={formData.repeatable_group_title || ''}
                    onChange={(e) => setFormData({ ...formData, repeatable_group_title: e.target.value })}
                    placeholder="e.g., Secondary Income Sources"
                    required={formData.item_type === 'repeatable_group'}
                  />
                </div>

                <div>
                  <Label htmlFor="repeatable_group_subtitle">Group Subtitle</Label>
                  <Input
                    id="repeatable_group_subtitle"
                    value={formData.repeatable_group_subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, repeatable_group_subtitle: e.target.value })}
                    placeholder="e.g., Please provide details for each income source"
                  />
                </div>

                <div>
                  <Label htmlFor="repeatable_group_top_button_text">Top Button Text</Label>
                  <Input
                    id="repeatable_group_top_button_text"
                    value={formData.repeatable_group_top_button_text || 'Add'}
                    onChange={(e) => setFormData({ ...formData, repeatable_group_top_button_text: e.target.value })}
                    placeholder="Add"
                  />
                </div>

                <div>
                  <Label htmlFor="repeatable_group_start_button_text">Start Button Text</Label>
                  <Input
                    id="repeatable_group_start_button_text"
                    value={formData.repeatable_group_start_button_text || 'Start'}
                    onChange={(e) => setFormData({ ...formData, repeatable_group_start_button_text: e.target.value })}
                    placeholder="Start"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="repeatable_group_target_table">Target Table *</Label>
                  <Select
                    value={formData.repeatable_group_target_table || ''}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      repeatable_group_target_table: value as 'project_secondary_incomes' | 'project_dependents' | 'project_debts'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target table" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project_secondary_incomes">Secondary Incomes</SelectItem>
                      <SelectItem value="project_dependents">Dependents</SelectItem>
                      <SelectItem value="project_debts">Debts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                type="number"
                id="display_order"
                value={String(formData.display_order)}
                onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                placeholder="Enter display order"
              />
            </div>

            <div>
              <Label htmlFor="participant_designation">Participant Designation</Label>
              <Select
                value={formData.participant_designation}
                onValueChange={(value) => setFormData({ ...formData, participant_designation: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo_applicant">Solo Applicant</SelectItem>
                  <SelectItem value="applicant_one">Applicant One</SelectItem>
                  <SelectItem value="applicant_two">Applicant Two</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="help_text">Help Text</Label>
              <Input
                id="help_text"
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                placeholder="Enter help text"
              />
            </div>

            <div>
              <Label htmlFor="placeholder_text">Placeholder Text</Label>
              <Input
                id="placeholder_text"
                value={formData.placeholder_text}
                onChange={(e) => setFormData({ ...formData, placeholder_text: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="required">Required</Label>
            <Checkbox
              id="required"
              checked={formData.required}
              onCheckedChange={(checked) => setFormData({ ...formData, required: !!checked })}
            />
          </div>

          {/* Subcategory Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                value={formData.subcategory || ''}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                placeholder="Enter subcategory"
              />
              <div className="flex items-center mt-2">
                <Checkbox
                  id="subcategory_1_initiator"
                  checked={formData.subcategory_1_initiator}
                  onCheckedChange={(checked) => setFormData({ ...formData, subcategory_1_initiator: !!checked })}
                />
                <Label htmlFor="subcategory_1_initiator" className="ml-2">Initiator</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="subcategory_2">Subcategory 2</Label>
              <Input
                id="subcategory_2"
                value={formData.subcategory_2 || ''}
                onChange={(e) => setFormData({ ...formData, subcategory_2: e.target.value })}
                placeholder="Enter subcategory 2"
              />
              <div className="flex items-center mt-2">
                <Checkbox
                  id="subcategory_2_initiator"
                  checked={formData.subcategory_2_initiator}
                  onCheckedChange={(checked) => setFormData({ ...formData, subcategory_2_initiator: !!checked })}
                />
                <Label htmlFor="subcategory_2_initiator" className="ml-2">Initiator</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="subcategory_3">Subcategory 3</Label>
              <Input
                id="subcategory_3"
                value={formData.subcategory_3 || ''}
                onChange={(e) => setFormData({ ...formData, subcategory_3: e.target.value })}
                placeholder="Enter subcategory 3"
              />
              <div className="flex items-center mt-2">
                <Checkbox
                  id="subcategory_3_initiator"
                  checked={formData.subcategory_3_initiator}
                  onCheckedChange={(checked) => setFormData({ ...formData, subcategory_3_initiator: !!checked })}
                />
                <Label htmlFor="subcategory_3_initiator" className="ml-2">Initiator</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="subcategory_4">Subcategory 4</Label>
              <Input
                id="subcategory_4"
                value={formData.subcategory_4 || ''}
                onChange={(e) => setFormData({ ...formData, subcategory_4: e.target.value })}
                placeholder="Enter subcategory 4"
              />
              <div className="flex items-center mt-2">
                <Checkbox
                  id="subcategory_4_initiator"
                  checked={formData.subcategory_4_initiator}
                  onCheckedChange={(checked) => setFormData({ ...formData, subcategory_4_initiator: !!checked })}
                />
                <Label htmlFor="subcategory_4_initiator" className="ml-2">Initiator</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="subcategory_5">Subcategory 5</Label>
              <Input
                id="subcategory_5"
                value={formData.subcategory_5 || ''}
                onChange={(e) => setFormData({ ...formData, subcategory_5: e.target.value })}
                placeholder="Enter subcategory 5"
              />
              <div className="flex items-center mt-2">
                <Checkbox
                  id="subcategory_5_initiator"
                  checked={formData.subcategory_5_initiator}
                  onCheckedChange={(checked) => setFormData({ ...formData, subcategory_5_initiator: !!checked })}
                />
                <Label htmlFor="subcategory_5_initiator" className="ml-2">Initiator</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : question ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </form>

        {/* Question Options Manager */}
        {question && (formData.item_type === 'single_choice_dropdown' || formData.item_type === 'multiple_choice_checkbox') && (
          <div className="mt-8">
            <QuestionOptionManager question={question} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
