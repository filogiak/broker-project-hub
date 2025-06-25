
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { SimpleRepeatableGroupService } from '@/services/simpleRepeatableGroupService';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

interface GroupQuestion {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  currentValue: any;
  typedValue: {
    textValue?: string | null;
    numericValue?: number | null;
    dateValue?: string | null;
    booleanValue?: boolean | null;
    jsonValue?: any | null;
    documentReferenceId?: string | null;
  };
}

export const useSimpleGroupQuestions = (
  targetTable: string,
  subcategory: string,
  groupIndex: number,
  participantDesignation?: ParticipantDesignation
) => {
  const { projectId } = useParams();
  const [questions, setQuestions] = useState<GroupQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  const loadQuestions = useCallback(async () => {
    if (!projectId || !targetTable || !subcategory) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get all questions for this subcategory
      const { data: requiredItems, error: itemsError } = await supabase
        .from('required_items')
        .select('id, item_name, item_type')
        .eq('subcategory', subcategory)
        .neq('item_type', 'repeatable_group')
        .order('priority', { ascending: true });

      if (itemsError) throw itemsError;

      // Load existing answers for this group and participant
      const buildAnswersQuery = (baseQuery: any) => {
        const query = baseQuery
          .eq('project_id', projectId)
          .eq('group_index', groupIndex);
        
        if (participantDesignation) {
          return query.eq('participant_designation', participantDesignation);
        }
        return query.is('participant_designation', null);
      };

      let answersQuery;
      switch (targetTable) {
        case 'project_secondary_income_items':
          answersQuery = buildAnswersQuery(
            supabase
              .from('project_secondary_income_items')
              .select('item_id, text_value, numeric_value, boolean_value, date_value, json_value, document_reference_id')
          );
          break;

        case 'project_dependent_items':
          answersQuery = buildAnswersQuery(
            supabase
              .from('project_dependent_items')
              .select('item_id, text_value, numeric_value, boolean_value, date_value, json_value, document_reference_id')
          );
          break;

        case 'project_debt_items':
          answersQuery = buildAnswersQuery(
            supabase
              .from('project_debt_items')
              .select('item_id, text_value, numeric_value, boolean_value, date_value, json_value, document_reference_id')
          );
          break;

        default:
          throw new Error(`Unsupported table: ${targetTable}`);
      }

      const { data: existingAnswers, error: answersError } = await answersQuery;
      if (answersError) throw answersError;

      // Create a map of existing answers
      const answersMap = new Map();
      existingAnswers?.forEach(answer => {
        answersMap.set(answer.item_id, answer);
      });

      // Build questions array with existing values
      const questionsData: GroupQuestion[] = requiredItems?.map(item => {
        const existingAnswer = answersMap.get(item.id);
        
        let currentValue = '';
        const typedValue = {
          textValue: existingAnswer?.text_value || null,
          numericValue: existingAnswer?.numeric_value || null,
          dateValue: existingAnswer?.date_value || null,
          booleanValue: existingAnswer?.boolean_value || null,
          jsonValue: existingAnswer?.json_value || null,
          documentReferenceId: existingAnswer?.document_reference_id || null,
        };

        // Set current value based on type
        switch (item.item_type) {
          case 'number':
            currentValue = typedValue.numericValue || '';
            break;
          case 'date':
            currentValue = typedValue.dateValue || '';
            break;
          case 'single_choice_dropdown':
            if (typedValue.booleanValue !== null) {
              currentValue = typedValue.booleanValue ? 'TRUE' : 'FALSE';
            } else if (typedValue.numericValue !== null) {
              currentValue = typedValue.numericValue.toString();
            } else {
              currentValue = typedValue.textValue || '';
            }
            break;
          case 'multiple_choice_checkbox':
            // FIXED: Handle array properly for multiple choice
            currentValue = Array.isArray(typedValue.jsonValue) ? typedValue.jsonValue : [];
            break;
          default:
            currentValue = typedValue.textValue || '';
        }

        return {
          id: item.id,
          itemId: item.id,
          itemName: item.item_name,
          itemType: item.item_type,
          currentValue,
          typedValue
        };
      }) || [];

      setQuestions(questionsData);
      setHasUnsavedChanges(false);

    } catch (error) {
      console.error('Error loading group questions:', error);
      toast({
        title: "Error loading questions",
        description: "Failed to load group questions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, targetTable, subcategory, groupIndex, participantDesignation, toast]);

  const saveAllAnswers = async (formData: Record<string, any>) => {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const savePromises = questions.map(async (question) => {
      const value = formData[question.itemId];
      if (value !== undefined && value !== '' && value !== null) {
        return SimpleRepeatableGroupService.saveAnswer(
          projectId,
          targetTable,
          question.itemId,
          groupIndex,
          value,
          question.itemType,
          participantDesignation
        );
      }
    });

    const results = await Promise.all(savePromises.filter(Boolean));
    
    // Check for errors
    const errors = results.filter(result => result?.error);
    if (errors.length > 0) {
      throw errors[0].error;
    }

    setHasUnsavedChanges(false);
    
    toast({
      title: "Answers saved",
      description: "All group answers have been saved successfully.",
    });
  };

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    questions,
    loading,
    hasUnsavedChanges,
    saveAllAnswers,
    refreshQuestions: loadQuestions
  };
};
