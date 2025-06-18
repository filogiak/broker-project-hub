
import { useState, useEffect, useCallback } from 'react';
import { ConditionalLogicService, type SaveTriggeredEvaluationParams } from '@/services/conditionalLogicService';
import { ChecklistItemService, TypedChecklistItem } from '@/services/checklistItemService';
import type { Database } from '@/integrations/supabase/types';

type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

interface ConditionalLogicResult {
  subcategories: string[];
  preservedAnswers: Record<string, any>;
}

export const useConditionalLogic = (
  projectId: string,
  categoryId: string,
  participantDesignation: ParticipantDesignation
) => {
  const [additionalQuestions, setAdditionalQuestions] = useState<TypedChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubcategories, setActiveSubcategories] = useState<string[]>([]);

  const loadExistingAdditionalQuestions = useCallback(async () => {
    if (!projectId || !categoryId) return;

    try {
      setLoading(true);
      console.log('🔄 Loading existing additional questions...');

      // Get current active subcategories first
      const currentSubcategories = await ConditionalLogicService.getCurrentActiveSubcategories(
        projectId,
        categoryId,
        participantDesignation
      );

      console.log('📝 Current active subcategories:', currentSubcategories);
      setActiveSubcategories(currentSubcategories);

      // Load additional questions for active subcategories
      if (currentSubcategories.length > 0) {
        const result = await ConditionalLogicService.getAdditionalQuestionsBySubcategoriesWithPreservation(
          currentSubcategories,
          categoryId,
          projectId,
          participantDesignation,
          {}
        );

        if (result.error) {
          console.error('Error loading additional questions:', result.error);
          setError(result.error.message);
          return;
        }

        // Map to TypedChecklistItem with proper structure
        const typedItems: TypedChecklistItem[] = result.data?.map(item => 
          ChecklistItemService.mapToTypedChecklistItem(item)
        ) || [];

        console.log('📝 Loaded existing additional questions:', typedItems.length);
        setAdditionalQuestions(typedItems);
      } else {
        setAdditionalQuestions([]);
      }

      setError(null);
    } catch (err) {
      console.error('Unexpected error loading additional questions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId, categoryId, participantDesignation]);

  const evaluateOnSave = useCallback(
    async (
      formDataByItemId: Record<string, any>,
      itemIdToChecklistItemIdMap: Record<string, string>
    ): Promise<ConditionalLogicResult> => {
      console.log('🔍 Evaluating conditional logic with formDataByItemId:', formDataByItemId);
      
      try {
        // Create the proper item ID to form ID mapping (reverse of what we have)
        const itemIdToFormIdMap: Record<string, string> = {};
        Object.entries(itemIdToChecklistItemIdMap).forEach(([itemId, checklistItemId]) => {
          itemIdToFormIdMap[itemId] = checklistItemId;
        });

        const params: SaveTriggeredEvaluationParams = {
          formData: formDataByItemId,
          categoryId,
          projectId,
          participantDesignation,
          itemIdToFormIdMap
        };

        const result = await ConditionalLogicService.evaluateLogicOnSave(params);
        
        console.log('🎉 Conditional logic evaluation result:', result);
        
        // Update active subcategories
        setActiveSubcategories(result.subcategories);
        
        // Reload additional questions to get newly created ones
        await loadExistingAdditionalQuestions();

        return result;
      } catch (error) {
        console.error('Error during conditional logic evaluation:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        return { subcategories: [], preservedAnswers: {} };
      }
    },
    [categoryId, projectId, participantDesignation, loadExistingAdditionalQuestions]
  );

  useEffect(() => {
    if (projectId && categoryId) {
      loadExistingAdditionalQuestions();
    }
  }, [projectId, categoryId, loadExistingAdditionalQuestions]);

  return {
    additionalQuestions,
    loading,
    error,
    activeSubcategories,
    evaluateOnSave,
    loadExistingAdditionalQuestions,
  };
};
