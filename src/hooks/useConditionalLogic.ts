
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
   * Evaluate conditional logic on save action and handle question generation/preservation
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
      console.log('Starting save-triggered conditional logic evaluation...');

      const params: SaveTriggeredEvaluationParams = {
        formData,
        categoryId,
        projectId,
        participantDesignation,
        itemIdToFormIdMap,
      };

      // Evaluate conditional logic on save
      const logicResult = await ConditionalLogicService.evaluateLogicOnSave(params);
      
      const newSubcategories = logicResult.subcategories;
      console.log('Logic evaluation result:', {
        subcategories: newSubcategories,
        preservedAnswersCount: Object.keys(logicResult.preservedAnswers).length
      });

      // Only clear and regenerate if subcategories actually changed
      if (newSubcategories.length > 0) {
        // Clear existing conditional questions that are no longer relevant
        await ConditionalLogicService.clearAdditionalQuestions(
          projectId,
          categoryId,
          participantDesignation
        );

        // Fetch new additional questions with preserved answers
        const { data, error } = await ConditionalLogicService.getAdditionalQuestionsBySubcategoriesWithPreservation(
          newSubcategories,
          categoryId,
          projectId,
          participantDesignation,
          logicResult.preservedAnswers
        );

        if (error) {
          console.error('Error fetching additional questions:', error);
          setAdditionalQuestions([]);
        } else {
          // Transform data to TypedChecklistItem format
          const typedQuestions: TypedChecklistItem[] = data?.map(item => {
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
          }) || [];

          // Sort by priority
          typedQuestions.sort((a, b) => (a.priority || 0) - (b.priority || 0));
          setAdditionalQuestions(typedQuestions);
          console.log('Additional questions loaded:', typedQuestions.length);
        }
      } else {
        setAdditionalQuestions([]);
      }

      setActiveSubcategories(newSubcategories);
      return logicResult;
    } catch (error) {
      console.error('Error in save-triggered conditional logic evaluation:', error);
      setAdditionalQuestions([]);
      setActiveSubcategories([]);
      return { subcategories: [], preservedAnswers: {} };
    } finally {
      setLoading(false);
    }
  }, [projectId, categoryId, participantDesignation]);

  /**
   * Load existing additional questions without triggering new logic evaluation
   */
  const loadExistingAdditionalQuestions = useCallback(async (subcategories: string[]) => {
    if (!projectId || !categoryId || subcategories.length === 0) {
      setAdditionalQuestions([]);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await ConditionalLogicService.getAdditionalQuestionsBySubcategoriesWithPreservation(
        subcategories,
        categoryId,
        projectId,
        participantDesignation
      );

      if (error) {
        console.error('Error loading existing additional questions:', error);
        setAdditionalQuestions([]);
      } else {
        // Transform data to TypedChecklistItem format
        const typedQuestions: TypedChecklistItem[] = data?.map(item => {
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
        }) || [];

        // Sort by priority
        typedQuestions.sort((a, b) => (a.priority || 0) - (b.priority || 0));
        setAdditionalQuestions(typedQuestions);
      }
    } catch (error) {
      console.error('Error loading existing additional questions:', error);
      setAdditionalQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, categoryId, participantDesignation]);

  return {
    additionalQuestions,
    loading,
    activeSubcategories,
    evaluateOnSave,
    loadExistingAdditionalQuestions,
  };
};
