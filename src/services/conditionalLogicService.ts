
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { ChecklistItemService } from './checklistItemService';

export interface LogicRule {
  id: string;
  triggerItemId: string;
  triggerValue: string;
  targetSubcategory: string;
  targetCategoryId?: string;
  isActive: boolean;
}

export interface ConditionalLogicResult {
  subcategories: string[];
  targetCategoryId?: string;
  preservedAnswers: Record<string, any>;
}

export interface SaveTriggeredEvaluationParams {
  formData: Record<string, any>;
  categoryId: string;
  projectId: string;
  participantDesignation?: Database['public']['Enums']['participant_designation'];
  itemIdToFormIdMap: Record<string, string>;
}

export interface QuestionPreservationResult {
  shouldPreserve: boolean;
  existingAnswers: Record<string, any>;
  subcategoriesChanged: boolean;
}

export class ConditionalLogicService {
  /**
   * Get all active logic rules for a specific category
   */
  static async getLogicRules(categoryId?: string): Promise<LogicRule[]> {
    try {
      let query = supabase
        .from('question_logic_rules')
        .select(`
          *,
          trigger_item:required_items!fk_question_logic_rules_trigger_item (
            id,
            item_name,
            category_id
          )
        `)
        .eq('is_active', true);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching logic rules:', error);
        return [];
      }

      // Filter by category if specified, and filter out rules where the trigger item no longer exists
      const filteredRules = data?.filter(rule => {
        const triggerItem = rule.trigger_item as any;
        const hasValidTriggerItem = triggerItem && triggerItem.id;
        
        if (!hasValidTriggerItem) return false;
        
        if (categoryId) {
          // Include rules where the trigger item is in the same category, or rules that target this category
          return triggerItem.category_id === categoryId || rule.target_category_id === categoryId;
        }
        
        return true;
      }).map(rule => ({
        id: rule.id,
        triggerItemId: rule.trigger_item_id,
        triggerValue: rule.trigger_value,
        targetSubcategory: rule.target_subcategory,
        targetCategoryId: rule.target_category_id || undefined,
        isActive: rule.is_active,
      })) || [];

      console.log(`Found ${filteredRules.length} active logic rules for category ${categoryId}`);
      return filteredRules;
    } catch (error) {
      console.error('Error in getLogicRules:', error);
      return [];
    }
  }

  /**
   * Enhanced save-triggered evaluation with better preservation logic and conditional question creation
   */
  static async evaluateLogicOnSave(params: SaveTriggeredEvaluationParams): Promise<ConditionalLogicResult> {
    try {
      const { formData, categoryId, projectId, participantDesignation, itemIdToFormIdMap } = params;
      
      console.log('🔧 Starting conditional logic evaluation for category:', categoryId);
      console.log('🔧 Form data received:', formData);
      console.log('🔧 Item ID to form ID mapping:', itemIdToFormIdMap);
      
      // Get current active subcategories before evaluation
      const currentActiveSubcategories = await this.getCurrentActiveSubcategories(
        projectId, 
        categoryId, 
        participantDesignation
      );
      
      const rules = await this.getLogicRules(categoryId);
      const newActiveSubcategories: string[] = [];

      console.log(`🔧 Evaluating ${rules.length} logic rules...`);

      // Evaluate which subcategories should be active based on form data
      for (const rule of rules) {
        console.log(`🔧 Evaluating rule: ${rule.triggerItemId} -> ${rule.targetSubcategory}`);
        
        // Get the form field ID for this trigger item
        const formFieldId = itemIdToFormIdMap[rule.triggerItemId];
        if (!formFieldId) {
          console.log(`🔧 No form field found for trigger item ${rule.triggerItemId}`);
          continue;
        }

        const currentValue = formData[formFieldId];
        console.log(`🔧 Checking trigger value: "${currentValue}" against rule value: "${rule.triggerValue}"`);
        
        if (this.valuesMatch(currentValue, rule.triggerValue)) {
          console.log(`🔧 ✅ Rule triggered! Adding subcategory: ${rule.targetSubcategory}`);
          newActiveSubcategories.push(rule.targetSubcategory);
        } else {
          console.log(`🔧 ❌ Rule not triggered`);
        }
      }

      const uniqueNewSubcategories = [...new Set(newActiveSubcategories)];
      
      // Check if subcategories have actually changed
      const subcategoriesChanged = !this.arraysEqual(
        currentActiveSubcategories.sort(), 
        uniqueNewSubcategories.sort()
      );

      console.log('🔧 Subcategory comparison:', {
        current: currentActiveSubcategories,
        new: uniqueNewSubcategories,
        changed: subcategoriesChanged
      });

      // Get preserved answers using enhanced preservation logic
      const preservationResult = await this.getEnhancedPreservedAnswers(
        projectId,
        categoryId,
        participantDesignation,
        uniqueNewSubcategories,
        currentActiveSubcategories,
        subcategoriesChanged
      );

      // Create conditional questions for newly activated subcategories (with proper duplicate prevention)
      if (uniqueNewSubcategories.length > 0) {
        await this.createConditionalQuestionsWithDuplicatePrevention(
          projectId,
          categoryId,
          participantDesignation,
          uniqueNewSubcategories
        );
      }

      return {
        subcategories: uniqueNewSubcategories,
        targetCategoryId: categoryId,
        preservedAnswers: preservationResult.existingAnswers,
      };
    } catch (error) {
      console.error('Error in conditional logic evaluation:', error);
      return { subcategories: [], preservedAnswers: {} };
    }
  }

  /**
   * Enhanced conditional question creation with proper duplicate prevention
   */
  static async createConditionalQuestionsWithDuplicatePrevention(
    projectId: string,
    categoryId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation'],
    activeSubcategories: string[] = []
  ) {
    try {
      console.log('🔧 Creating conditional questions with duplicate prevention for subcategories:', activeSubcategories);
      
      // Get all required items that match the active subcategories and are NOT initiators
      const { data: conditionalItems, error } = await supabase
        .from('required_items')
        .select('*')
        .eq('category_id', categoryId)
        .or(`subcategory.in.(${activeSubcategories.join(',')}),subcategory_2.in.(${activeSubcategories.join(',')}),subcategory_3.in.(${activeSubcategories.join(',')}),subcategory_4.in.(${activeSubcategories.join(',')}),subcategory_5.in.(${activeSubcategories.join(',')})`)
        .eq('subcategory_1_initiator', false)
        .eq('subcategory_2_initiator', false)
        .eq('subcategory_3_initiator', false)
        .eq('subcategory_4_initiator', false)
        .eq('subcategory_5_initiator', false);

      if (error) {
        console.error('Error fetching conditional items:', error);
        return;
      }

      if (!conditionalItems || conditionalItems.length === 0) {
        console.log('🔧 No conditional items found for subcategories');
        return;
      }

      console.log('🔧 Found conditional items to potentially create:', conditionalItems.length);

      // Check which items already exist to prevent duplicates
      let existingQuery = supabase
        .from('project_checklist_items')
        .select('item_id')
        .eq('project_id', projectId)
        .in('item_id', conditionalItems.map(item => item.id));

      if (participantDesignation) {
        existingQuery = existingQuery.eq('participant_designation', participantDesignation);
      }

      const { data: existingItems, error: existingError } = await existingQuery;
      
      if (existingError) {
        console.error('Error checking existing items:', existingError);
        return;
      }

      const existingItemIds = new Set(existingItems?.map(item => item.item_id) || []);
      console.log('🔧 Existing item IDs:', Array.from(existingItemIds));

      // Filter out items that already exist
      const itemsToCreate = conditionalItems.filter(item => !existingItemIds.has(item.id));
      console.log('🔧 Items to create after duplicate check:', itemsToCreate.length);

      // Create checklist items for each new conditional question
      for (const item of itemsToCreate) {
        const insertData: any = {
          project_id: projectId,
          item_id: item.id,
          status: 'pending'
        };

        // Handle participant designation based on item scope
        if (item.scope === 'PARTICIPANT' && participantDesignation) {
          insertData.participant_designation = participantDesignation;
        }

        try {
          const { data, error } = await supabase
            .from('project_checklist_items')
            .insert(insertData)
            .select()
            .single();

          if (error) {
            console.error(`🔧 Error creating conditional question ${item.item_name}:`, error);
          } else if (data) {
            console.log(`🔧 ✅ Created conditional question: ${item.item_name}`);
          }
        } catch (err) {
          console.error(`🔧 Exception creating conditional question ${item.item_name}:`, err);
        }
      }

      console.log('🔧 Finished creating conditional questions with duplicate prevention');
    } catch (error) {
      console.error('Error in createConditionalQuestionsWithDuplicatePrevention:', error);
    }
  }

  /**
   * Get additional questions with proper exclusion of initiator questions
   */
  static async getAdditionalQuestionsBySubcategoriesWithPreservation(
    subcategories: string[],
    categoryId: string,
    projectId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation'],
    preservedAnswers: Record<string, any> = {}
  ) {
    if (subcategories.length === 0) {
      return { data: [], error: null };
    }

    console.log('🔧 Fetching additional questions for subcategories:', subcategories);

    let query = supabase
      .from('project_checklist_items')
      .select(`
        *,
        required_items!inner (
          *
        )
      `)
      .eq('required_items.category_id', categoryId)
      .eq('project_id', projectId)
      // CRITICAL: Exclude initiator questions from additional questions
      .eq('required_items.subcategory_1_initiator', false)
      .eq('required_items.subcategory_2_initiator', false)
      .eq('required_items.subcategory_3_initiator', false)
      .eq('required_items.subcategory_4_initiator', false)
      .eq('required_items.subcategory_5_initiator', false);

    // Add subcategory filter - check all 5 subcategory fields
    const subcategoryFilter = subcategories.map(sub => 
      `required_items.subcategory.eq.${sub},required_items.subcategory_2.eq.${sub},required_items.subcategory_3.eq.${sub},required_items.subcategory_4.eq.${sub},required_items.subcategory_5.eq.${sub}`
    ).join(',');
    
    query = query.or(subcategoryFilter);

    if (participantDesignation) {
      query = query.or(`participant_designation.eq.${participantDesignation},participant_designation.is.null`);
    }

    const result = await query;

    console.log('🔧 Additional questions query result:', {
      count: result.data?.length || 0,
      subcategoriesRequested: subcategories,
      preservedAnswersCount: Object.keys(preservedAnswers).length
    });

    // Integrate preserved answers into the result
    if (result.data && Object.keys(preservedAnswers).length > 0) {
      result.data.forEach(item => {
        if (preservedAnswers[item.id]) {
          const requiredItem = item.required_items as any;
          
          // Set the appropriate value field based on item type
          switch (requiredItem.item_type) {
            case 'text':
            case 'single_choice_dropdown':
              item.text_value = preservedAnswers[item.id];
              break;
            case 'number':
              item.numeric_value = preservedAnswers[item.id];
              break;
            case 'date':
              item.date_value = preservedAnswers[item.id];
              break;
            case 'boolean':
              item.boolean_value = preservedAnswers[item.id];
              break;
            case 'multiple_choice_checkbox':
              item.json_value = preservedAnswers[item.id];
              break;
          }
          console.log('🔧 Applied preserved answer for item:', item.id);
        }
      });
    }

    return result;
  }

  /**
   * Get current active subcategories for a project/category combination
   */
  static async getCurrentActiveSubcategories(
    projectId: string,
    categoryId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation']
  ): Promise<string[]> {
    try {
      let query = supabase
        .from('project_checklist_items')
        .select(`
          required_items!inner (
            subcategory,
            subcategory_2,
            subcategory_3,
            subcategory_4,
            subcategory_5
          )
        `)
        .eq('project_id', projectId)
        .eq('required_items.category_id', categoryId);

      if (participantDesignation) {
        query = query.eq('participant_designation', participantDesignation);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching current active subcategories:', error);
        return [];
      }

      const subcategories = new Set<string>();
      data?.forEach(item => {
        const requiredItem = item.required_items as any;
        if (requiredItem.subcategory) subcategories.add(requiredItem.subcategory);
        if (requiredItem.subcategory_2) subcategories.add(requiredItem.subcategory_2);
        if (requiredItem.subcategory_3) subcategories.add(requiredItem.subcategory_3);
        if (requiredItem.subcategory_4) subcategories.add(requiredItem.subcategory_4);
        if (requiredItem.subcategory_5) subcategories.add(requiredItem.subcategory_5);
      });

      return Array.from(subcategories);
    } catch (error) {
      console.error('Error getting current active subcategories:', error);
      return [];
    }
  }

  /**
   * Enhanced preserved answers logic with smart question lifecycle management
   */
  static async getEnhancedPreservedAnswers(
    projectId: string,
    categoryId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation'],
    newActiveSubcategories: string[] = [],
    currentActiveSubcategories: string[] = [],
    subcategoriesChanged: boolean = false
  ): Promise<QuestionPreservationResult> {
    try {
      console.log('Enhanced preservation analysis:', {
        newActiveSubcategories,
        currentActiveSubcategories,
        subcategoriesChanged
      });

      // If no subcategories are active, return empty result
      if (newActiveSubcategories.length === 0) {
        return {
          shouldPreserve: false,
          existingAnswers: {},
          subcategoriesChanged
        };
      }

      // Get intersection of current and new subcategories (these should be preserved)
      const subcategoriesToPreserve = newActiveSubcategories.filter(sub => 
        currentActiveSubcategories.includes(sub)
      );

      console.log('Subcategories to preserve:', subcategoriesToPreserve);

      // If no subcategories overlap, no preservation needed
      if (subcategoriesToPreserve.length === 0) {
        return {
          shouldPreserve: false,
          existingAnswers: {},
          subcategoriesChanged
        };
      }

      // For now, return empty preserved answers - we can enhance this later
      return {
        shouldPreserve: true,
        existingAnswers: {},
        subcategoriesChanged
      };
    } catch (error) {
      console.error('Error in enhanced preserved answers:', error);
      return {
        shouldPreserve: false,
        existingAnswers: {},
        subcategoriesChanged: false
      };
    }
  }

  /**
   * Check if two values match for conditional logic evaluation
   */
  static valuesMatch(currentValue: any, ruleValue: string): boolean {
    if (currentValue === null || currentValue === undefined || currentValue === '') {
      return false;
    }

    // Handle array values (like multiple choice)
    if (Array.isArray(currentValue)) {
      try {
        const ruleArray = JSON.parse(ruleValue);
        if (Array.isArray(ruleArray)) {
          return ruleArray.some(val => currentValue.includes(val));
        }
      } catch {
        // Not JSON, check if any array element matches the rule value
        return currentValue.includes(ruleValue);
      }
    }

    // Handle JSON rule values (multiple acceptable values)
    try {
      const ruleArray = JSON.parse(ruleValue);
      if (Array.isArray(ruleArray)) {
        return ruleArray.includes(String(currentValue));
      }
    } catch {
      // Not JSON, do string comparison
    }

    // Simple string comparison
    return String(currentValue) === String(ruleValue);
  }

  /**
   * Check if two arrays are equal (order doesn't matter)
   */
  static arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  }
}
