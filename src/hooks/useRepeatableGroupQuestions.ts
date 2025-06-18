
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';

interface QuestionItem {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  required?: boolean;
  priority?: number;
}

export const useRepeatableGroupQuestions = (
  targetTable: string,
  subcategory: string,
  groupIndex?: number
) => {
  const { projectId } = useParams();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
  }, [targetTable, subcategory]);

  const loadQuestions = async () => {
    if (!subcategory) return;

    try {
      setLoading(true);
      
      // Get all questions with the same subcategory as the repeatable group
      const { data, error } = await supabase
        .from('required_items')
        .select(`
          id,
          item_name,
          item_type,
          priority,
          subcategory
        `)
        .eq('subcategory', subcategory)
        .neq('item_type', 'repeatable_group') // Exclude the repeatable group itself
        .order('priority', { ascending: true });

      if (error) throw error;

      const formattedQuestions = data?.map(item => ({
        id: item.id,
        itemId: item.id,
        itemName: item.item_name,
        itemType: item.item_type,
        required: true, // Assume all questions in repeatable groups are required
        priority: item.priority || 0
      })) || [];

      setQuestions(formattedQuestions);

    } catch (error) {
      console.error('Error loading repeatable group questions:', error);
      toast({
        title: "Error loading questions",
        description: "Failed to load questions for this group.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAnswers = async (targetGroupIndex: number) => {
    if (!projectId || !targetTable || !targetGroupIndex) return {};

    try {
      const { data, error } = await supabase
        .from(targetTable)
        .select('item_id, text_value, numeric_value, boolean_value, date_value, json_value')
        .eq('project_id', projectId)
        .eq('group_index', targetGroupIndex);

      if (error) throw error;

      const formData: Record<string, any> = {};
      data?.forEach(item => {
        // Determine the correct value based on the stored data
        const value = item.text_value || 
                     item.numeric_value || 
                     item.boolean_value || 
                     item.date_value || 
                     item.json_value;
        if (value !== null && value !== undefined) {
          formData[item.item_id] = value;
        }
      });

      return formData;

    } catch (error) {
      console.error('Error loading existing answers:', error);
      return {};
    }
  };

  const saveAnswers = async (formData: Record<string, any>, targetGroupIndex: number) => {
    if (!projectId || !targetTable) return;

    try {
      const savePromises = questions.map(async (question) => {
        const value = formData[question.id];
        if (value === undefined || value === '') return;

        // Determine the correct column based on question type
        let insertData: any = {
          project_id: projectId,
          item_id: question.id,
          group_index: targetGroupIndex,
          status: 'submitted'
        };

        // Route to appropriate column based on type
        switch (question.itemType) {
          case 'number':
            insertData.numeric_value = Number(value);
            break;
          case 'date':
            insertData.date_value = value;
            break;
          case 'single_choice_dropdown':
            // Check if the value represents a boolean
            if (value === 'TRUE' || value === 'FALSE') {
              insertData.boolean_value = value === 'TRUE';
            } else if (!isNaN(Number(value))) {
              insertData.numeric_value = Number(value);
            } else {
              insertData.text_value = value;
            }
            break;
          case 'multiple_choice_checkbox':
            insertData.json_value = Array.isArray(value) ? value : [value];
            break;
          default:
            insertData.text_value = String(value);
        }

        // Delete existing entry for this item and group, then insert new one
        await supabase
          .from(targetTable)
          .delete()
          .eq('project_id', projectId)
          .eq('item_id', question.id)
          .eq('group_index', targetGroupIndex);

        const { error } = await supabase
          .from(targetTable)
          .insert(insertData);

        if (error) throw error;
      });

      await Promise.all(savePromises);

      toast({
        title: "Answers saved",
        description: "Your answers have been saved successfully.",
      });

    } catch (error) {
      console.error('Error saving answers:', error);
      toast({
        title: "Error saving answers",
        description: "Failed to save your answers. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    questions,
    loading,
    saveAnswers,
    loadExistingAnswers
  };
};
