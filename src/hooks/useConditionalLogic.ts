
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
      formDataByItemId: Record<string, any>,
      itemIdToChecklistItemIdMap: Record<string, string>
    ): Promise<ConditionalLogicResult> => {
      console.log('Evaluating conditional logic with formDataByItemId:', formDataByItemId);
      console.log('Using mapping:', itemIdToChecklistItemIdMap);
      
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
        const conditionalItems = allItems?.filter(item => 
          item.validation_rules && 
          typeof item.validation_rules === 'object' && 
          item.validation_rules !== null
        ) || [];
        
        console.log('Found conditional items:', conditionalItems.length);
  
        for (const item of conditionalItems) {
          try {
            const validationRules = item.validation_rules as Record<string, any>;
            console.log(`Evaluating rules for item ${item.item_name}:`, validationRules);
  
            for (const subcategory in validationRules) {
              if (validationRules.hasOwnProperty(subcategory)) {
                const conditions = validationRules[subcategory];
                console.log(`Checking subcategory ${subcategory} with conditions:`, conditions);
  
                if (Array.isArray(conditions)) {
                  let allConditionsMet = true;
  
                  for (const condition of conditions) {
                    // Use item.id (the required_items ID) to look up the input value
                    const inputValue = formDataByItemId[item.id];
                    console.log(`Condition check - Item ID: ${item.id}, Input Value: ${inputValue}, Condition:`, condition);

                    if (inputValue === undefined || inputValue === null || inputValue === '') {
                      console.log(`No input value for item ${item.id}, condition not met`);
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
                    
                    console.log(`Condition result: ${conditionMet}`);
  
                    if (!conditionMet) {
                      allConditionsMet = false;
                      break;
                    }
                  }
  
                  if (allConditionsMet && !unlockedSubcategories.includes(subcategory)) {
                    console.log(`✅ All conditions met for subcategory: ${subcategory}`);
                    unlockedSubcategories.push(subcategory);
  
                    // Create new checklist items for this subcategory
                    await this.createSubcategoryItems(projectId, categoryId, subcategory, participantDesignation);
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
  
      console.log('Final unlocked subcategories:', unlockedSubcategories);
      return { subcategories: unlockedSubcategories, preservedAnswers };
    },
    [categoryId, projectId, participantDesignation]
  );

  // Helper method to create subcategory items
  const createSubcategoryItems = async (
    projectId: string,
    categoryId: string,
    subcategory: string,
    participantDesignation: ParticipantDesignation
  ) => {
    try {
      console.log(`Creating items for subcategory: ${subcategory}`);
      
      // Get all items for this subcategory
      const { data: subcategoryItems, error } = await supabase
        .from('required_items')
        .select('*')
        .eq('category_id', categoryId)
        .or(`subcategory.eq.${subcategory},subcategory_2.eq.${subcategory},subcategory_3.eq.${subcategory},subcategory_4.eq.${subcategory},subcategory_5.eq.${subcategory}`);

      if (error) {
        console.error('Error fetching subcategory items:', error);
        return;
      }

      // Create checklist items for each required item
      const createPromises = subcategoryItems?.map(async (item) => {
        // Check if item already exists
        const { data: existing } = await supabase
          .from('project_checklist_items')
          .select('id')
          .eq('project_id', projectId)
          .eq('item_id', item.id)
          .eq('participant_designation', participantDesignation)
          .single();

        if (existing) {
          console.log(`Item already exists for ${item.item_name}`);
          return;
        }

        // Create new checklist item
        const insertData: any = {
          project_id: projectId,
          item_id: item.id,
          participant_designation: participantDesignation,
          status: 'pending'
        };

        const { error: insertError } = await supabase
          .from('project_checklist_items')
          .insert(insertData);

        if (insertError) {
          console.error(`Error creating checklist item for ${item.item_name}:`, insertError);
        } else {
          console.log(`✅ Created checklist item for ${item.item_name}`);
        }
      }) || [];

      await Promise.all(createPromises);
    } catch (error) {
      console.error('Error creating subcategory items:', error);
    }
  };

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
