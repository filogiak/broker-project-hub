
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SimpleRepeatableGroupService } from '@/services/simpleRepeatableGroupService';

interface SimpleGroupQuestion {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  currentValue?: any;
  required?: boolean;
  priority?: number;
}

export const useSimpleGroupQuestions = (
  projectId: string,
  targetTable: string,
  subcategory: string,
  groupIndex: number | null
) => {
  const [questions, setQuestions] = useState<SimpleGroupQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadQuestions = useCallback(async () => {
    if (!subcategory) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get questions for this subcategory (mirrors project_checklist_items)
      const { data: requiredItems, error: itemsError } = await supabase
        .from('required_items')
        .select('id, item_name, item_type, priority')
        .eq('subcategory', subcategory)
        .neq('item_type', 'repeatable_group')
        .order('priority', { ascending: true });

      if (itemsError) throw itemsError;

      // If we have a group index, load existing answers
      let existingAnswers: Record<string, any> = {};
      if (groupIndex !== null && projectId && targetTable) {
        const { data: groupData, error: groupError } = await SimpleRepeatableGroupService.loadAllGroups(projectId, targetTable);
        
        if (groupError) throw groupError;
        
        // Filter for this specific group
        const thisGroupData = groupData?.filter(item => item.group_index === groupIndex) || [];
        
        existingAnswers = thisGroupData.reduce((acc, item) => {
          const value = item.text_value || 
                       item.numeric_value || 
                       item.boolean_value || 
                       item.date_value || 
                       item.json_value;
          if (value !== null && value !== undefined) {
            acc[item.item_id] = value;
          }
          return acc;
        }, {} as Record<string, any>);
      }

      // Format questions with current values
      const formattedQuestions = requiredItems?.map(item => ({
        id: item.id,
        itemId: item.id,
        itemName: item.item_name,
        itemType: item.item_type,
        currentValue: existingAnswers[item.id],
        required: true,
        priority: item.priority || 0
      })) || [];

      setQuestions(formattedQuestions);

    } catch (error) {
      console.error('Error loading simple group questions:', error);
      toast({
        title: "Error loading questions",
        description: "Failed to load questions for this group.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [subcategory, groupIndex, projectId, targetTable, toast]);

  const saveAnswer = useCallback(async (itemId: string, value: any, itemType: string) => {
    if (!projectId || !targetTable || groupIndex === null) return;

    try {
      const { error } = await SimpleRepeatableGroupService.saveAnswer(
        projectId,
        targetTable,
        itemId,
        groupIndex,
        value,
        itemType
      );

      if (error) throw error;

      toast({
        title: "Answer saved",
        description: "Your answer has been saved.",
      });

    } catch (error) {
      console.error('Error saving answer:', error);
      toast({
        title: "Error saving answer",
        description: "Failed to save your answer.",
        variant: "destructive",
      });
      throw error;
    }
  }, [projectId, targetTable, groupIndex, toast]);

  const saveAllAnswers = useCallback(async (formData: Record<string, any>) => {
    if (!projectId || !targetTable || groupIndex === null) return;

    try {
      const savePromises = questions.map(async (question) => {
        const value = formData[question.id];
        if (value === undefined || value === '') return;

        return SimpleRepeatableGroupService.saveAnswer(
          projectId,
          targetTable,
          question.id,
          groupIndex,
          value,
          question.itemType
        );
      });

      const results = await Promise.all(savePromises);
      
      // Check for errors
      const errors = results.filter(result => result?.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      toast({
        title: "Answers saved",
        description: "All answers have been saved successfully.",
      });

    } catch (error) {
      console.error('Error saving all answers:', error);
      toast({
        title: "Error saving answers",
        description: "Failed to save answers.",
        variant: "destructive",
      });
      throw error;
    }
  }, [projectId, targetTable, groupIndex, questions, toast]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    questions,
    loading,
    saveAnswer,
    saveAllAnswers,
    refreshQuestions: loadQuestions
  };
};
