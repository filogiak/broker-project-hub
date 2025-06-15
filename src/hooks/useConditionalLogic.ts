
import { useState, useEffect, useRef } from 'react';
import { ConditionalLogicService, ConditionalLogicResult } from '@/services/conditionalLogicService';
import { ChecklistItemService, TypedChecklistItem } from '@/services/checklistItemService';
import type { Database } from '@/integrations/supabase/types';

type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

export const useConditionalLogic = (
  projectId: string,
  categoryId: string,
  participantDesignation?: ParticipantDesignation,
  formData: Record<string, any> = {},
  items: TypedChecklistItem[] = []
) => {
  const [additionalQuestions, setAdditionalQuestions] = useState<TypedChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubcategories, setActiveSubcategories] = useState<string[]>([]);
  const previousSubcategoriesRef = useRef<string[]>([]);

  // Create mapping from item ID to checklist item ID for logic evaluation
  const itemIdToFormIdMap = items.reduce((map, item) => {
    map[item.itemId] = item.id;
    return map;
  }, {} as Record<string, string>);

  useEffect(() => {
    const evaluateLogic = async () => {
      if (!projectId || !categoryId || Object.keys(formData).length === 0) {
        return;
      }

      try {
        setLoading(true);

        // Evaluate conditional logic
        const logicResult: ConditionalLogicResult = await ConditionalLogicService.evaluateLogic(
          formData,
          categoryId,
          itemIdToFormIdMap
        );

        const newSubcategories = logicResult.subcategories;
        const previousSubcategories = previousSubcategoriesRef.current;

        // Check if subcategories changed (reversible logic)
        const subcategoriesChanged = 
          newSubcategories.length !== previousSubcategories.length ||
          !newSubcategories.every(sub => previousSubcategories.includes(sub));

        if (subcategoriesChanged) {
          console.log('Subcategories changed, clearing and regenerating additional questions');
          
          // Clear existing additional questions if subcategories changed
          if (previousSubcategories.length > 0) {
            await ConditionalLogicService.clearAdditionalQuestions(
              projectId,
              categoryId,
              participantDesignation
            );
          }

          // Fetch new additional questions based on active subcategories
          if (newSubcategories.length > 0) {
            const { data, error } = await ConditionalLogicService.getAdditionalQuestionsBySubcategories(
              newSubcategories,
              categoryId,
              participantDesignation
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
            }
          } else {
            setAdditionalQuestions([]);
          }

          // Update refs
          setActiveSubcategories(newSubcategories);
          previousSubcategoriesRef.current = newSubcategories;
        }
      } catch (error) {
        console.error('Error in conditional logic evaluation:', error);
        setAdditionalQuestions([]);
        setActiveSubcategories([]);
      } finally {
        setLoading(false);
      }
    };

    evaluateLogic();
  }, [projectId, categoryId, participantDesignation, formData, itemIdToFormIdMap]);

  return {
    additionalQuestions,
    loading,
    activeSubcategories,
  };
};
