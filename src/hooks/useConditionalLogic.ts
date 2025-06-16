
import { useState, useCallback } from 'react';
import { ConditionalLogicService, ConditionalLogicResult, SaveTriggeredEvaluationParams } from '@/services/conditionalLogicService';
import { ChecklistItemService, TypedChecklistItem } from '@/services/checklistItemService';
import type { Database } from '@/integrations/supabase/types';

type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

export const useConditionalLogic = (
  projectId: string,
  categoryId: string,
  participantDesignation?: ParticipantDesignation
) => {
  const [additionalQuestions, setAdditionalQuestions] = useState<TypedChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubcategories, setActiveSubcategories] = useState<string[]>([]);

  /**
   * Enhanced save-triggered evaluation with smart preservation
   */
  const evaluateOnSave = useCallback(async (
    formData: Record<string, any>,
    itemIdToFormIdMap: Record<string, string>
  ): Promise<ConditionalLogicResult> => {
    if (!projectId || !categoryId) {
      return { subcategories: [], preservedAnswers: {} };
    }

    try {
      setLoading(true);
      console.log('Starting enhanced save-triggered conditional logic evaluation...');

      const params: SaveTriggeredEvaluationParams = {
        formData,
        categoryId,
        projectId,
        participantDesignation,
        itemIdToFormIdMap,
      };

      // Use the enhanced evaluation method from Phase 2
      const logicResult = await ConditionalLogicService.evaluateLogicOnSave(params);
      
      const newSubcategories = logicResult.subcategories;
      console.log('Enhanced logic evaluation result:', {
        subcategories: newSubcategories,
        preservedAnswersCount: Object.keys(logicResult.preservedAnswers).length,
        targetCategoryId: logicResult.targetCategoryId
      });

      // Update active subcategories immediately
      setActiveSubcategories(newSubcategories);

      // Smart conditional question management
      if (newSubcategories.length > 0) {
        // Use smart clearing that preserves relevant questions
        await ConditionalLogicService.smartClearAdditionalQuestions(
          projectId,
          categoryId,
          participantDesignation,
          newSubcategories // Keep questions for these subcategories
        );

        // Fetch enhanced additional questions with preserved answers
        const { data, error } = await ConditionalLogicService.getAdditionalQuestionsBySubcategoriesWithPreservation(
          newSubcategories,
          categoryId,
          projectId,
          participantDesignation,
          logicResult.preservedAnswers
        );

        if (error) {
          console.error('Error fetching enhanced additional questions:', error);
          setAdditionalQuestions([]);
        } else {
          const typedQuestions = this.transformToTypedQuestions(data || []);
          setAdditionalQuestions(typedQuestions);
          console.log('Enhanced additional questions loaded:', typedQuestions.length);
        }
      } else {
        // Clear all conditional questions if no subcategories are active
        await ConditionalLogicService.smartClearAdditionalQuestions(
          projectId,
          categoryId,
          participantDesignation,
          [] // Clear all
        );
        setAdditionalQuestions([]);
      }

      return logicResult;
    } catch (error) {
      console.error('Error in enhanced save-triggered conditional logic evaluation:', error);
      setAdditionalQuestions([]);
      setActiveSubcategories([]);
      return { subcategories: [], preservedAnswers: {} };
    } finally {
      setLoading(false);
    }
  }, [projectId, categoryId, participantDesignation]);

  /**
   * Load existing additional questions without triggering evaluation
   */
  const loadExistingAdditionalQuestions = useCallback(async (subcategories?: string[]) => {
    if (!projectId || !categoryId) {
      setAdditionalQuestions([]);
      return;
    }

    try {
      setLoading(true);
      
      // If no subcategories provided, get current active ones
      const targetSubcategories = subcategories || await ConditionalLogicService.getCurrentActiveSubcategories(
        projectId,
        categoryId,
        participantDesignation
      );

      if (targetSubcategories.length === 0) {
        setAdditionalQuestions([]);
        setActiveSubcategories([]);
        return;
      }

      const { data, error } = await ConditionalLogicService.getAdditionalQuestionsBySubcategoriesWithPreservation(
        targetSubcategories,
        categoryId,
        projectId,
        participantDesignation
      );

      if (error) {
        console.error('Error loading existing additional questions:', error);
        setAdditionalQuestions([]);
      } else {
        const typedQuestions = this.transformToTypedQuestions(data || []);
        setAdditionalQuestions(typedQuestions);
        setActiveSubcategories(targetSubcategories);
        console.log('Existing additional questions loaded:', typedQuestions.length);
      }
    } catch (error) {
      console.error('Error loading existing additional questions:', error);
      setAdditionalQuestions([]);
      setActiveSubcategories([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, categoryId, participantDesignation]);

  /**
   * Helper method to transform data to TypedChecklistItem format
   */
  const transformToTypedQuestions = useCallback((data: any[]): TypedChecklistItem[] => {
    const typedQuestions: TypedChecklistItem[] = data.map(item => {
      const requiredItem = item.required_items as any;
      return {
        id: item.id,
        projectId: item.project_id,
        itemId: item.item_id,
        participantDesignation: item.participant_designation,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        itemName: requiredItem?.item_name || '',
        itemType: requiredItem?.item_type || 'text',
        scope: requiredItem?.scope || 'PROJECT',
        categoryId: requiredItem?.category_id,
        priority: requiredItem?.priority || 0,
        displayValue: ChecklistItemService.getDisplayValue({
          typedValue: {
            textValue: item.text_value,
            numericValue: item.numeric_value,
            dateValue: item.date_value,
            booleanValue: item.boolean_value,
            jsonValue: item.json_value,
            documentReferenceId: item.document_reference_id,
          },
          itemType: requiredItem?.item_type || 'text',
        } as TypedChecklistItem),
        typedValue: {
          textValue: item.text_value,
          numericValue: item.numeric_value,
          dateValue: item.date_value,
          booleanValue: item.boolean_value,
          jsonValue: item.json_value,
          documentReferenceId: item.document_reference_id,
        },
      };
    });

    // Sort by priority for consistent ordering
    return typedQuestions.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }, []);

  return {
    additionalQuestions,
    loading,
    activeSubcategories,
    evaluateOnSave,
    loadExistingAdditionalQuestions,
  };
};
