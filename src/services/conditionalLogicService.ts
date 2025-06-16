
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { ChecklistItemService } from './checklistItemService';

type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type ProjectChecklistItem = Database['public']['Tables']['project_checklist_items']['Row'];
type LogicRule = Database['public']['Tables']['question_logic_rules']['Row'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

export interface ConditionalQuestion {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  subcategory: string;
  displayValue?: any;
  priority?: number;
  categoryId: string;
}

export interface LogicEvaluationResult {
  subcategories: string[];
  newQuestions: ConditionalQuestion[];
  preservedAnswers: Record<string, any>;
}

export interface ConditionalLogicResult {
  subcategories: string[];
  preservedAnswers: Record<string, any>;
  targetCategoryId?: string;
}

export interface SaveTriggeredEvaluationParams {
  formData: Record<string, any>;
  categoryId: string;
  projectId: string;
  participantDesignation?: ParticipantDesignation;
  itemIdToFormIdMap: Record<string, string>;
}

export class ConditionalLogicService {
  /**
   * Enhanced conditional logic evaluation with multi-subcategory support
   * Now supports one answer triggering multiple subcategories simultaneously
   */
  static async evaluateConditionalLogic(
    projectId: string,
    categoryId: string,
    participantDesignation: ParticipantDesignation,
    formAnswers: Record<string, any>,
    itemIdToFormIdMap: Record<string, string>
  ): Promise<LogicEvaluationResult> {
    console.log('🔍 Evaluating enhanced multi-subcategory conditional logic...');
    console.log('Form answers:', formAnswers);
    console.log('Item mapping:', itemIdToFormIdMap);

    try {
      // Get all active logic rules
      const { data: logicRules, error: rulesError } = await supabase
        .from('question_logic_rules')
        .select('*')
        .eq('is_active', true);

      if (rulesError) {
        throw new Error(`Failed to fetch logic rules: ${rulesError.message}`);
      }

      console.log('📋 Found logic rules:', logicRules?.length || 0);

      const triggeredSubcategories = new Set<string>();

      // Enhanced evaluation: allow multiple subcategories per trigger
      for (const rule of logicRules || []) {
        const formFieldId = itemIdToFormIdMap[rule.trigger_item_id];
        if (!formFieldId) {
          console.log(`⚠️ No form field found for trigger item ${rule.trigger_item_id}`);
          continue;
        }

        const userAnswer = formAnswers[formFieldId];
        if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
          continue;
        }

        console.log(`🔍 Checking rule: ${rule.trigger_value} vs ${userAnswer} → ${rule.target_subcategory}`);

        // Enhanced matching for multi-choice and single choice
        let isMatch = false;
        if (Array.isArray(userAnswer)) {
          // For multiple choice answers - check if any selected option matches
          isMatch = userAnswer.includes(rule.trigger_value);
        } else {
          // For single answers - exact match
          isMatch = String(userAnswer) === String(rule.trigger_value);
        }

        if (isMatch) {
          console.log(`✅ Rule triggered: ${rule.target_subcategory}`);
          triggeredSubcategories.add(rule.target_subcategory);
        }
      }

      const subcategoriesArray = Array.from(triggeredSubcategories);
      console.log('🎯 Final triggered subcategories:', subcategoriesArray);

      if (subcategoriesArray.length === 0) {
        return {
          subcategories: [],
          newQuestions: [],
          preservedAnswers: {}
        };
      }

      // Fetch conditional questions for all triggered subcategories
      const { data: conditionalItems, error: itemsError } = await supabase
        .from('required_items')
        .select(`
          *,
          items_categories (
            id,
            name
          )
        `)
        .eq('category_id', categoryId)
        .or(
          subcategoriesArray.map(subcat => 
            `subcategory.eq.${subcat},subcategory_2.eq.${subcat},subcategory_3.eq.${subcat},subcategory_4.eq.${subcat},subcategory_5.eq.${subcat}`
          ).join(',')
        );

      if (itemsError) {
        throw new Error(`Failed to fetch conditional items: ${itemsError.message}`);
      }

      console.log('📝 Found conditional items:', conditionalItems?.length || 0);

      // Filter out initiator questions - we only want pure conditional questions
      const pureConditionalItems = (conditionalItems || []).filter(item => {
        const isInitiator = item.subcategory_1_initiator || 
                           item.subcategory_2_initiator || 
                           item.subcategory_3_initiator || 
                           item.subcategory_4_initiator || 
                           item.subcategory_5_initiator;
        return !isInitiator;
      });

      console.log('🔍 Pure conditional items (non-initiators):', pureConditionalItems.length);

      // Get existing checklist items to preserve answers
      const { data: existingItems, error: existingError } = await supabase
        .from('project_checklist_items')
        .select(`
          *,
          required_items (
            item_name,
            item_type,
            subcategory,
            subcategory_2,
            subcategory_3,
            subcategory_4,
            subcategory_5,
            priority,
            category_id
          )
        `)
        .eq('project_id', projectId)
        .eq('participant_designation', participantDesignation);

      if (existingError) {
        console.error('Error fetching existing items:', existingError);
      }

      const preservedAnswers: Record<string, any> = {};
      const existingItemsMap = new Map();

      (existingItems || []).forEach(item => {
        if (item.required_items) {
          existingItemsMap.set(item.item_id, item);
          if (item.value) {
            const displayValue = ChecklistItemService.getDisplayValue(item);
            if (displayValue !== undefined && displayValue !== '') {
              preservedAnswers[item.id] = displayValue;
            }
          }
        }
      });

      // Create new conditional questions
      const newQuestions: ConditionalQuestion[] = [];
      const createPromises: Promise<any>[] = [];

      for (const item of pureConditionalItems) {
        // Skip if already exists
        if (existingItemsMap.has(item.id)) {
          console.log(`📋 Conditional item already exists: ${item.item_name}`);
          const existingItem = existingItemsMap.get(item.id);
          
          // Determine which subcategory was triggered for this item
          let triggeredSubcategory = '';
          for (const subcat of subcategoriesArray) {
            if (item.subcategory === subcat || 
                item.subcategory_2 === subcat || 
                item.subcategory_3 === subcat || 
                item.subcategory_4 === subcat || 
                item.subcategory_5 === subcat) {
              triggeredSubcategory = subcat;
              break;
            }
          }

          newQuestions.push({
            id: existingItem.id,
            itemId: item.id,
            itemName: item.item_name,
            itemType: item.item_type,
            subcategory: triggeredSubcategory,
            displayValue: ChecklistItemService.getDisplayValue(existingItem),
            priority: item.priority,
            categoryId: item.category_id || '',
          });
          continue;
        }

        // Determine which subcategory was triggered for this item
        let triggeredSubcategory = '';
        for (const subcat of subcategoriesArray) {
          if (item.subcategory === subcat || 
              item.subcategory_2 === subcat || 
              item.subcategory_3 === subcat || 
              item.subcategory_4 === subcat || 
              item.subcategory_5 === subcat) {
            triggeredSubcategory = subcat;
            break;
          }
        }

        console.log(`📝 Creating new conditional item: ${item.item_name} for subcategory: ${triggeredSubcategory}`);

        // Create the checklist item
        const createPromise = supabase
          .from('project_checklist_items')
          .insert({
            project_id: projectId,
            item_id: item.id,
            participant_designation: participantDesignation,
            status: 'pending'
          })
          .select()
          .single()
          .then(({ data: newItem, error }) => {
            if (error) {
              console.error(`Error creating conditional item ${item.item_name}:`, error);
              return null;
            }

            if (newItem) {
              newQuestions.push({
                id: newItem.id,
                itemId: item.id,
                itemName: item.item_name,
                itemType: item.item_type,
                subcategory: triggeredSubcategory,
                priority: item.priority,
                categoryId: item.category_id || '',
              });
            }
            return newItem;
          });

        createPromises.push(createPromise);
      }

      // Wait for all creations to complete
      await Promise.all(createPromises);

      // Sort questions by priority
      newQuestions.sort((a, b) => (a.priority || 0) - (b.priority || 0));

      console.log('✅ Enhanced conditional logic evaluation complete');
      console.log(`📝 Created ${newQuestions.length} questions for ${subcategoriesArray.length} subcategories`);
      console.log(`💾 Preserved ${Object.keys(preservedAnswers).length} existing answers`);

      return {
        subcategories: subcategoriesArray,
        newQuestions,
        preservedAnswers
      };

    } catch (error) {
      console.error('❌ Error evaluating conditional logic:', error);
      throw error;
    }
  }

  /**
   * Enhanced save-triggered evaluation method
   */
  static async evaluateLogicOnSave(params: SaveTriggeredEvaluationParams): Promise<ConditionalLogicResult> {
    if (!params.participantDesignation) {
      return { subcategories: [], preservedAnswers: {} };
    }

    const result = await this.evaluateConditionalLogic(
      params.projectId,
      params.categoryId,
      params.participantDesignation,
      params.formData,
      params.itemIdToFormIdMap
    );

    return {
      subcategories: result.subcategories,
      preservedAnswers: result.preservedAnswers,
      targetCategoryId: params.categoryId
    };
  }

  /**
   * Smart clear additional questions
   */
  static async smartClearAdditionalQuestions(
    projectId: string,
    categoryId: string,
    participantDesignation?: ParticipantDesignation,
    keepSubcategories: string[] = []
  ): Promise<void> {
    if (!participantDesignation) return;

    try {
      // Get conditional questions that should be removed
      const { data: itemsToRemove } = await supabase
        .from('project_checklist_items')
        .select(`
          *,
          required_items (
            subcategory,
            subcategory_2,
            subcategory_3,
            subcategory_4,
            subcategory_5,
            subcategory_1_initiator,
            subcategory_2_initiator,
            subcategory_3_initiator,
            subcategory_4_initiator,
            subcategory_5_initiator,
            category_id
          )
        `)
        .eq('project_id', projectId)
        .eq('participant_designation', participantDesignation);

      const itemsToDelete = (itemsToRemove || []).filter(item => {
        const requiredItem = item.required_items;
        if (!requiredItem || requiredItem.category_id !== categoryId) return false;

        // Check if this is a conditional question
        const hasAnySubcategory = !!(requiredItem.subcategory || 
                                   requiredItem.subcategory_2 || 
                                   requiredItem.subcategory_3 || 
                                   requiredItem.subcategory_4 || 
                                   requiredItem.subcategory_5);

        const isAnyInitiator = !!(requiredItem.subcategory_1_initiator || 
                                requiredItem.subcategory_2_initiator || 
                                requiredItem.subcategory_3_initiator || 
                                requiredItem.subcategory_4_initiator || 
                                requiredItem.subcategory_5_initiator);

        if (!hasAnySubcategory || isAnyInitiator) return false;

        // Check if any of its subcategories should be kept
        const itemSubcategories = [
          requiredItem.subcategory,
          requiredItem.subcategory_2,
          requiredItem.subcategory_3,
          requiredItem.subcategory_4,
          requiredItem.subcategory_5
        ].filter(Boolean);

        return !itemSubcategories.some(sub => keepSubcategories.includes(sub));
      });

      if (itemsToDelete.length > 0) {
        await supabase
          .from('project_checklist_items')
          .delete()
          .in('id', itemsToDelete.map(item => item.id));
      }
    } catch (error) {
      console.error('Error clearing additional questions:', error);
    }
  }

  /**
   * Get additional questions by subcategories with preservation
   */
  static async getAdditionalQuestionsBySubcategoriesWithPreservation(
    subcategories: string[],
    categoryId: string,
    projectId: string,
    participantDesignation?: ParticipantDesignation,
    preservedAnswers: Record<string, any> = {}
  ): Promise<{ data?: any[]; error?: any }> {
    if (!participantDesignation) {
      return { data: [] };
    }

    try {
      const { data, error } = await supabase
        .from('project_checklist_items')
        .select(`
          *,
          required_items (
            item_name,
            item_type,
            subcategory,
            subcategory_2,
            subcategory_3,
            subcategory_4,
            subcategory_5,
            subcategory_1_initiator,
            subcategory_2_initiator,
            subcategory_3_initiator,
            subcategory_4_initiator,
            subcategory_5_initiator,
            priority,
            category_id
          )
        `)
        .eq('project_id', projectId)
        .eq('participant_designation', participantDesignation);

      if (error) return { error };

      const filteredData = (data || []).filter(item => {
        const requiredItem = item.required_items;
        if (!requiredItem || requiredItem.category_id !== categoryId) return false;

        // Check if this is a conditional question (has subcategory but is not initiator)
        const hasAnySubcategory = !!(requiredItem.subcategory || 
                                   requiredItem.subcategory_2 || 
                                   requiredItem.subcategory_3 || 
                                   requiredItem.subcategory_4 || 
                                   requiredItem.subcategory_5);

        const isAnyInitiator = !!(requiredItem.subcategory_1_initiator || 
                                requiredItem.subcategory_2_initiator || 
                                requiredItem.subcategory_3_initiator || 
                                requiredItem.subcategory_4_initiator || 
                                requiredItem.subcategory_5_initiator);

        if (!hasAnySubcategory || isAnyInitiator) return false;

        // Check if any of its subcategories match the target subcategories
        const itemSubcategories = [
          requiredItem.subcategory,
          requiredItem.subcategory_2,
          requiredItem.subcategory_3,
          requiredItem.subcategory_4,
          requiredItem.subcategory_5
        ].filter(Boolean);

        return itemSubcategories.some(sub => subcategories.includes(sub));
      });

      return { data: filteredData };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Get current active subcategories
   */
  static async getCurrentActiveSubcategories(
    projectId: string,
    categoryId: string,
    participantDesignation?: ParticipantDesignation
  ): Promise<string[]> {
    if (!participantDesignation) return [];

    try {
      const { data } = await supabase
        .from('project_checklist_items')
        .select(`
          required_items (
            subcategory,
            subcategory_2,
            subcategory_3,
            subcategory_4,
            subcategory_5,
            category_id
          )
        `)
        .eq('project_id', projectId)
        .eq('participant_designation', participantDesignation);

      const subcategories = new Set<string>();
      (data || []).forEach(item => {
        const requiredItem = item.required_items;
        if (requiredItem && requiredItem.category_id === categoryId) {
          [
            requiredItem.subcategory,
            requiredItem.subcategory_2,
            requiredItem.subcategory_3,
            requiredItem.subcategory_4,
            requiredItem.subcategory_5
          ].forEach(sub => {
            if (sub) subcategories.add(sub);
          });
        }
      });

      return Array.from(subcategories);
    } catch (error) {
      console.error('Error getting current active subcategories:', error);
      return [];
    }
  }

  /**
   * Load existing additional questions for a category and participant
   */
  static async loadExistingAdditionalQuestions(
    projectId: string,
    categoryId: string,
    participantDesignation: ParticipantDesignation
  ): Promise<ConditionalQuestion[]> {
    try {
      console.log('🔍 Loading existing additional questions with enhanced 5-subcategory support...');

      // Get existing checklist items that are conditional (have subcategories but are not initiators)
      const { data: existingItems, error } = await supabase
        .from('project_checklist_items')
        .select(`
          *,
          required_items (
            item_name,
            item_type,
            subcategory,
            subcategory_2,
            subcategory_3,
            subcategory_4,
            subcategory_5,
            subcategory_1_initiator,
            subcategory_2_initiator,
            subcategory_3_initiator,
            subcategory_4_initiator,
            subcategory_5_initiator,
            priority,
            category_id
          )
        `)
        .eq('project_id', projectId)
        .eq('participant_designation', participantDesignation);

      if (error) {
        throw new Error(`Failed to fetch existing items: ${error.message}`);
      }

      const conditionalQuestions: ConditionalQuestion[] = [];

      for (const item of existingItems || []) {
        const requiredItem = item.required_items;
        if (!requiredItem) continue;

        // Skip if not in the target category
        if (requiredItem.category_id !== categoryId) continue;

        // Check if this is a conditional question (has subcategory but is not an initiator)
        const hasAnySubcategory = !!(requiredItem.subcategory || 
                                   requiredItem.subcategory_2 || 
                                   requiredItem.subcategory_3 || 
                                   requiredItem.subcategory_4 || 
                                   requiredItem.subcategory_5);

        const isAnyInitiator = !!(requiredItem.subcategory_1_initiator || 
                                requiredItem.subcategory_2_initiator || 
                                requiredItem.subcategory_3_initiator || 
                                requiredItem.subcategory_4_initiator || 
                                requiredItem.subcategory_5_initiator);

        if (hasAnySubcategory && !isAnyInitiator) {
          // Determine the primary subcategory for display
          const primarySubcategory = requiredItem.subcategory || 
                                   requiredItem.subcategory_2 || 
                                   requiredItem.subcategory_3 || 
                                   requiredItem.subcategory_4 || 
                                   requiredItem.subcategory_5 || '';

          conditionalQuestions.push({
            id: item.id,
            itemId: item.item_id,
            itemName: requiredItem.item_name,
            itemType: requiredItem.item_type,
            subcategory: primarySubcategory,
            displayValue: ChecklistItemService.getDisplayValue(item),
            priority: requiredItem.priority,
            categoryId: requiredItem.category_id || '',
          });
        }
      }

      // Sort by priority
      conditionalQuestions.sort((a, b) => (a.priority || 0) - (b.priority || 0));

      console.log(`📝 Loaded ${conditionalQuestions.length} existing additional questions`);
      return conditionalQuestions;

    } catch (error) {
      console.error('❌ Error loading existing additional questions:', error);
      throw error;
    }
  }
}
