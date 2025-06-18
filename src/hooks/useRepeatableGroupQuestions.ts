
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { RepeatableGroupService } from '@/services/repeatableGroupService';

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
  subcategory: string
) => {
  const { projectId } = useParams();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadQuestions = useCallback(async () => {
    if (!subcategory) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
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
        .neq('item_type', 'repeatable_group')
        .order('priority', { ascending: true });

      if (error) throw error;

      const formattedQuestions = data?.map(item => ({
        id: item.id,
        itemId: item.id,
        itemName: item.item_name,
        itemType: item.item_type,
        required: true,
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
  }, [subcategory, toast]);

  const loadExistingAnswers = useCallback(async (targetGroupIndex: number) => {
    if (!projectId || !targetTable || !targetGroupIndex) return {};

    try {
      const { data, error } = await RepeatableGroupService.loadExistingAnswers(
        projectId, 
        targetTable, 
        targetGroupIndex
      );

      if (error) throw error;

      const formData: Record<string, any> = {};
      data?.forEach(item => {
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
  }, [projectId, targetTable]);

  const saveAnswers = useCallback(async (formData: Record<string, any>, targetGroupIndex: number) => {
    if (!projectId || !targetTable) return;

    try {
      const savePromises = questions.map(async (question) => {
        const value = formData[question.id];
        if (value === undefined || value === '') return;

        let insertData: any = {};

        switch (question.itemType) {
          case 'number':
            insertData.numeric_value = Number(value);
            break;
          case 'date':
            insertData.date_value = value;
            break;
          case 'single_choice_dropdown':
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

        const { error } = await RepeatableGroupService.saveAnswer(
          projectId,
          targetTable,
          question.id,
          targetGroupIndex,
          insertData
        );

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
  }, [projectId, targetTable, questions, toast]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    questions,
    loading,
    saveAnswers,
    loadExistingAnswers
  };
};
