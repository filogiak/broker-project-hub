import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

      const result = await supabase
        .from('project_checklist_items')
        .select(`
          *,
          required_items!inner(*)
        `)
        .eq('project_id', projectId)
        .eq('required_items.category_id', categoryId)
        .not('required_items.subcategory', 'is', null)
        .eq('participant_designation', participantDesignation);

      if (result.error) {
        console.error('Error loading existing additional questions:', result.error);
        setError(result.error.message);
        return;
      }

      // Map to TypedChecklistItem with proper structure
      const typedItems: TypedChecklistItem[] = result.data?.map(item => 
        ChecklistItemService.mapToTypedChecklistItem(item)
      ) || [];

      console.log('📝 Loaded existing additional questions:', typedItems.length);
      setAdditionalQuestions(typedItems);

      // Extract active subcategories
      const subcategories = new Set<string>();
      typedItems.forEach(item => {
        if (item.subcategory) subcategories.add(item.subcategory);
        if (item.subcategory2) subcategories.add(item.subcategory2);
        if (item.subcategory3) subcategories.add(item.subcategory3);
        if (item.subcategory4) subcategories.add(item.subcategory4);
        if (item.subcategory5) subcategories.add(item.subcategory5);
      });

      setActiveSubcategories(Array.from(subcategories));
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
      formData: Record<string, any>,
      itemIdToFormIdMap: Record<string, string>
    ): Promise<ConditionalLogicResult> => {
      console.log('Evaluating conditional logic...');
      const unlockedSubcategories: string[] = [];
      const preservedAnswers: Record<string, any> = {};
  
      try {
        // Fetch all required items for the project and category
        const { data: allItems, error: itemsError } = await supabase
          .from('required_items')
          .select('*')
          .eq('category_id', categoryId);
  
        if (itemsError) {
          console.error('Error fetching required items:', itemsError);
          setError(itemsError.message);
          return { subcategories: [], preservedAnswers: {} };
        }
  
        // Filter items that have conditional logic (validation rules)
        const conditionalItems = allItems?.filter(item => item.validation_rules) || [];
  
        for (const item of conditionalItems) {
          try {
            const validationRules = item.validation_rules;
  
            if (validationRules && typeof validationRules === 'object') {
              for (const subcategory in validationRules) {
                if (validationRules.hasOwnProperty(subcategory)) {
                  const conditions = validationRules[subcategory];
  
                  if (Array.isArray(conditions)) {
                    let allConditionsMet = true;
  
                    for (const condition of conditions) {
                      const formId = itemIdToFormIdMap[item.id];
                      const inputValue = formData[formId];
  
                      if (inputValue === undefined) {
                        allConditionsMet = false;
                        break;
                      }
  
                      // Evaluate the condition based on its type
                      let conditionMet = false;
                      if (condition.type === 'equals') {
                        conditionMet = inputValue == condition.value;
                      } else if (condition.type === 'notEquals') {
                        conditionMet = inputValue != condition.value;
                      } else if (condition.type === 'greaterThan') {
                        conditionMet = Number(inputValue) > Number(condition.value);
                      } else if (condition.type === 'lessThan') {
                        conditionMet = Number(inputValue) < Number(condition.value);
                      } else if (condition.type === 'contains') {
                        if (Array.isArray(inputValue)) {
                          conditionMet = inputValue.includes(condition.value);
                        } else if (typeof inputValue === 'string') {
                          conditionMet = inputValue.includes(condition.value);
                        }
                      } else if (condition.type === 'notContains') {
                        if (Array.isArray(inputValue)) {
                          conditionMet = !inputValue.includes(condition.value);
                        } else if (typeof inputValue === 'string') {
                          conditionMet = !inputValue.includes(condition.value);
                        }
                      }
  
                      if (!conditionMet) {
                        allConditionsMet = false;
                        break;
                      }
                    }
  
                    if (allConditionsMet && !unlockedSubcategories.includes(subcategory)) {
                      unlockedSubcategories.push(subcategory);
  
                      // Preserve existing answers for the subcategory
                      const { data: subcategoryItems, error: subcategoryItemsError } = await supabase
                        .from('required_items')
                        .select('id')
                        .eq('category_id', categoryId)
                        .eq('subcategory', subcategory);
  
                      if (subcategoryItemsError) {
                        console.error('Error fetching subcategory items:', subcategoryItemsError);
                        continue;
                      }
  
                      subcategoryItems?.forEach(subItem => {
                        const formId = itemIdToFormIdMap[subItem.id];
                        if (formData.hasOwnProperty(formId)) {
                          preservedAnswers[formId] = formData[formId];
                        }
                      });
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.error(`Error evaluating conditional logic for item ${item.id}:`, e);
          }
        }
      } catch (error) {
        console.error('Error during conditional logic evaluation:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
  
      console.log('Unlocked subcategories:', unlockedSubcategories);
      console.log('Preserved answers:', preservedAnswers);
      return { subcategories: unlockedSubcategories, preservedAnswers };
    },
    [categoryId]
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
