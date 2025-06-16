import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

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
    let query = supabase
      .from('question_logic_rules')
      .select('*')
      .eq('is_active', true);

    if (categoryId) {
      query = query.or(`target_category_id.eq.${categoryId},target_category_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching logic rules:', error);
      return [];
    }

    return data?.map(rule => ({
      id: rule.id,
      triggerItemId: rule.trigger_item_id,
      triggerValue: rule.trigger_value,
      targetSubcategory: rule.target_subcategory,
      targetCategoryId: rule.target_category_id || undefined,
      isActive: rule.is_active,
    })) || [];
  }

  /**
   * Enhanced save-triggered evaluation with better preservation logic and conditional question creation
   */
  static async evaluateLogicOnSave(params: SaveTriggeredEvaluationParams): Promise<ConditionalLogicResult> {
    try {
      const { formData, categoryId, projectId, participantDesignation, itemIdToFormIdMap } = params;
      
      console.log('🔧 Starting enhanced conditional logic evaluation for category:', categoryId);
      
      // Get current active subcategories before evaluation
      const currentActiveSubcategories = await this.getCurrentActiveSubcategories(
        projectId, 
        categoryId, 
        participantDesignation
      );
      
      const rules = await this.getLogicRules(categoryId);
      const newActiveSubcategories: string[] = [];

      // Evaluate which subcategories should be active based on form data
      for (const rule of rules) {
        const formFieldId = itemIdToFormIdMap[rule.triggerItemId];
        if (!formFieldId) continue;

        const currentValue = formData[formFieldId];
        
        if (this.valuesMatch(currentValue, rule.triggerValue)) {
          newActiveSubcategories.push(rule.targetSubcategory);
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
      console.error('Error in enhanced conditional logic evaluation:', error);
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
        .in('subcategory', activeSubcategories)
        .eq('subcategory_1_initiator', false)
        .eq('subcategory_2_initiator', false);

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
   * FIXED: Get additional questions with proper exclusion of initiator questions
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
          item_name,
          item_type,
          scope,
          category_id,
          priority,
          subcategory,
          subcategory_1_initiator,
          subcategory_2_initiator
        )
      `)
      .in('required_items.subcategory', subcategories)
      .eq('required_items.category_id', categoryId)
      .eq('project_id', projectId)
      // CRITICAL FIX: Exclude initiator questions from additional questions
      .eq('required_items.subcategory_1_initiator', false)
      .eq('required_items.subcategory_2_initiator', false);

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
            subcategory
          )
        `)
        .eq('project_id', projectId)
        .eq('required_items.category_id', categoryId)
        .not('required_items.subcategory', 'is', null);

      if (participantDesignation) {
        query = query.eq('participant_designation', participantDesignation);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching current active subcategories:', error);
        return [];
      }

      const subcategories = data?.map(item => {
        const requiredItem = item.required_items as any;
        return requiredItem.subcategory;
      }).filter(Boolean) || [];

      return [...new Set(subcategories)];
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

      // Get existing answers for preserved subcategories
      let query = supabase
        .from('project_checklist_items')
        .select(`
          id,
          text_value,
          numeric_value,
          date_value,
          boolean_value,
          json_value,
          required_items!inner (
            id,
            subcategory,
            item_type
          )
        `)
        .eq('project_id', projectId)
        .in('required_items.subcategory', subcategoriesToPreserve)
        .eq('required_items.category_id', categoryId);

      if (participantDesignation) {
        query = query.eq('participant_designation', participantDesignation);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching preserved answers:', error);
        return {
          shouldPreserve: false,
          existingAnswers: {},
          subcategoriesChanged
        };
      }

      const preservedAnswers: Record<string, any> = {};

      data?.forEach(item => {
        const requiredItem = item.required_items as any;
        
        // Determine the value based on item type
        let value = null;
        switch (requiredItem.item_type) {
          case 'text':
          case 'single_choice_dropdown':
            value = item.text_value;
            break;
          case 'number':
            value = item.numeric_value;
            break;
          case 'date':
            value = item.date_value;
            break;
          case 'boolean':
            value = item.boolean_value;
            break;
          case 'multiple_choice_checkbox':
            value = item.json_value;
            break;
          default:
            value = item.text_value;
        }

        // Only preserve non-empty values
        if (this.isValidPreservationValue(value)) {
          preservedAnswers[item.id] = value;
        }
      });

      console.log('Enhanced preserved answers retrieved:', Object.keys(preservedAnswers).length);

      return {
        shouldPreserve: Object.keys(preservedAnswers).length > 0,
        existingAnswers: preservedAnswers,
        subcategoriesChanged
      };
    } catch (error) {
      console.error('Error in enhanced preservation logic:', error);
      return {
        shouldPreserve: false,
        existingAnswers: {},
        subcategoriesChanged
      };
    }
  }

  /**
   * Smart question lifecycle management - only clear questions that are no longer relevant
   */
  static async smartClearAdditionalQuestions(
    projectId: string,
    categoryId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation'],
    subcategoriesToKeep: string[] = []
  ) {
    try {
      // Get all conditional question item IDs for this category
      const { data: allConditionalItems } = await supabase
        .from('required_items')
        .select('id, subcategory')
        .eq('category_id', categoryId)
        .not('subcategory', 'is', null);

      if (!allConditionalItems || allConditionalItems.length === 0) {
        return { data: null, error: null };
      }

      // Filter out items that should be kept
      const itemsToDelete = allConditionalItems
        .filter(item => !subcategoriesToKeep.includes(item.subcategory))
        .map(item => item.id);

      if (itemsToDelete.length === 0) {
        console.log('No conditional questions need to be cleared');
        return { data: null, error: null };
      }

      console.log('Clearing conditional questions for subcategories not in:', subcategoriesToKeep);
      console.log('Items to delete:', itemsToDelete.length);

      // Delete only the specific items that are no longer relevant
      let query = supabase
        .from('project_checklist_items')
        .delete()
        .eq('project_id', projectId)
        .in('status', ['pending', 'submitted']) // Only clear non-approved questions
        .in('item_id', itemsToDelete);

      if (participantDesignation) {
        query = query.eq('participant_designation', participantDesignation);
      }

      return await query;
    } catch (error) {
      console.error('Error in smart question clearing:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if a value is valid for preservation (not null, undefined, or empty)
   */
  private static isValidPreservationValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }

  /**
   * Compare two arrays for equality
   */
  private static arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  /**
   * Enhanced check if two values match for trigger evaluation
   * Now supports multiple trigger values stored as JSON arrays for single-choice dropdowns
   */
  private static valuesMatch(currentValue: any, triggerValue: string): boolean {
    if (currentValue === undefined || currentValue === null || currentValue === '') {
      return false;
    }

    // Try to parse triggerValue as JSON array (for multiple trigger values)
    let triggerValues: string[];
    try {
      const parsed = JSON.parse(triggerValue);
      if (Array.isArray(parsed)) {
        triggerValues = parsed;
      } else {
        // Not an array, treat as single value
        triggerValues = [triggerValue];
      }
    } catch {
      // Not valid JSON, treat as single value
      triggerValues = [triggerValue];
    }

    // Handle array values (for multiple choice questions)
    if (Array.isArray(currentValue)) {
      return triggerValues.some(triggerVal => currentValue.includes(triggerVal));
    }

    // Handle single values - check if current value matches any of the trigger values
    const currentValueStr = String(currentValue).toLowerCase();
    return triggerValues.some(triggerVal => 
      currentValueStr === String(triggerVal).toLowerCase()
    );
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  static async getAdditionalQuestionsBySubcategories(
    subcategories: string[],
    categoryId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation']
  ) {
    if (subcategories.length === 0) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('project_checklist_items')
      .select(`
        *,
        required_items!inner (
          item_name,
          item_type,
          scope,
          category_id,
          priority,
          subcategory
        )
      `)
      .in('required_items.subcategory', subcategories)
      .eq('required_items.category_id', categoryId);

    if (participantDesignation) {
      query = query.or(`participant_designation.eq.${participantDesignation},participant_designation.is.null`);
    }

    return await query;
  }

  /**
   * Legacy clear method - replaced by smartClearAdditionalQuestions
   */
  static async clearAdditionalQuestions(
    projectId: string,
    categoryId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation']
  ) {
    // Use smart clearing with empty keep list (clears all)
    return await this.smartClearAdditionalQuestions(
      projectId,
      categoryId,
      participantDesignation,
      []
    );
  }

  // Legacy methods kept for backward compatibility
  static async getPreservedAnswers(
    projectId: string,
    categoryId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation'],
    activeSubcategories: string[] = []
  ): Promise<Record<string, any>> {
    const result = await this.getEnhancedPreservedAnswers(
      projectId,
      categoryId,
      participantDesignation,
      activeSubcategories,
      [],
      false
    );
    return result.existingAnswers;
  }

  /**
   * Legacy method for backward compatibility - kept for now but should be phased out
   */
  static async evaluateLogic(
    formData: Record<string, any>,
    categoryId: string,
    itemIdToFormIdMap: Record<string, string>
  ): Promise<ConditionalLogicResult> {
    try {
      const rules = await this.getLogicRules(categoryId);
      const activeSubcategories: string[] = [];

      for (const rule of rules) {
        const formFieldId = itemIdToFormIdMap[rule.triggerItemId];
        if (!formFieldId) continue;

        const currentValue = formData[formFieldId];
        
        if (this.valuesMatch(currentValue, rule.triggerValue)) {
          activeSubcategories.push(rule.targetSubcategory);
        }
      }

      return {
        subcategories: [...new Set(activeSubcategories)],
        targetCategoryId: categoryId,
        preservedAnswers: {},
      };
    } catch (error) {
      console.error('Error evaluating conditional logic:', error);
      return { subcategories: [], preservedAnswers: {} };
    }
  }

  /**
   * Legacy method - use createConditionalQuestionsWithDuplicatePrevention instead
   */
  static async createConditionalQuestions(
    projectId: string,
    categoryId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation'],
    activeSubcategories: string[] = []
  ) {
    return await this.createConditionalQuestionsWithDuplicatePrevention(
      projectId,
      categoryId,
      participantDesignation,
      activeSubcategories
    );
  }
}
