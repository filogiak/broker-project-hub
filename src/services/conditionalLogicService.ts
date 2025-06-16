
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
   * Evaluate form data against logic rules on save to determine which subcategories should be shown
   * This is the new save-triggered approach that preserves existing answers
   */
  static async evaluateLogicOnSave(params: SaveTriggeredEvaluationParams): Promise<ConditionalLogicResult> {
    try {
      const { formData, categoryId, projectId, participantDesignation, itemIdToFormIdMap } = params;
      
      console.log('Evaluating conditional logic on save for category:', categoryId);
      
      const rules = await this.getLogicRules(categoryId);
      const activeSubcategories: string[] = [];

      // Evaluate which subcategories should be active based on form data
      for (const rule of rules) {
        const formFieldId = itemIdToFormIdMap[rule.triggerItemId];
        if (!formFieldId) continue;

        const currentValue = formData[formFieldId];
        
        if (this.valuesMatch(currentValue, rule.triggerValue)) {
          activeSubcategories.push(rule.targetSubcategory);
        }
      }

      // Get preserved answers from existing conditional questions
      const preservedAnswers = await this.getPreservedAnswers(
        projectId,
        categoryId,
        participantDesignation,
        [...new Set(activeSubcategories)]
      );

      console.log('Conditional logic evaluation complete:', {
        activeSubcategories: [...new Set(activeSubcategories)],
        preservedAnswersCount: Object.keys(preservedAnswers).length
      });

      return {
        subcategories: [...new Set(activeSubcategories)],
        targetCategoryId: categoryId,
        preservedAnswers,
      };
    } catch (error) {
      console.error('Error evaluating conditional logic on save:', error);
      return { subcategories: [], preservedAnswers: {} };
    }
  }

  /**
   * Get preserved answers from existing conditional questions to prevent data loss
   */
  static async getPreservedAnswers(
    projectId: string,
    categoryId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation'],
    activeSubcategories: string[] = []
  ): Promise<Record<string, any>> {
    try {
      if (activeSubcategories.length === 0) {
        return {};
      }

      // Get existing checklist items for the active subcategories
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
        .in('required_items.subcategory', activeSubcategories)
        .eq('required_items.category_id', categoryId)
        .not('text_value', 'is', null)
        .not('text_value', 'eq', '');

      if (participantDesignation) {
        query = query.eq('participant_designation', participantDesignation);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching preserved answers:', error);
        return {};
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

        if (value !== null && value !== undefined && value !== '') {
          preservedAnswers[item.id] = value;
        }
      });

      console.log('Preserved answers retrieved:', Object.keys(preservedAnswers).length);
      return preservedAnswers;
    } catch (error) {
      console.error('Error getting preserved answers:', error);
      return {};
    }
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
   * Check if two values match for trigger evaluation
   */
  private static valuesMatch(currentValue: any, triggerValue: string): boolean {
    if (currentValue === undefined || currentValue === null || currentValue === '') {
      return false;
    }

    // Handle array values (for multiple choice questions)
    if (Array.isArray(currentValue)) {
      return currentValue.includes(triggerValue);
    }

    // Handle string comparison (case-insensitive)
    return String(currentValue).toLowerCase() === triggerValue.toLowerCase();
  }

  /**
   * Get additional questions based on active subcategories with preserved answers integration
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
      .eq('required_items.category_id', categoryId)
      .eq('project_id', projectId);

    if (participantDesignation) {
      query = query.or(`participant_designation.eq.${participantDesignation},participant_designation.is.null`);
    }

    const result = await query;

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
        }
      });
    }

    return result;
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
   * Clear additional questions for a specific category and participant
   */
  static async clearAdditionalQuestions(
    projectId: string,
    categoryId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation']
  ) {
    // First get the item IDs to delete
    const { data: itemIds } = await supabase
      .from('required_items')
      .select('id')
      .eq('category_id', categoryId)
      .not('subcategory', 'is', null);

    if (!itemIds || itemIds.length === 0) {
      return { data: null, error: null };
    }

    const itemIdArray = itemIds.map(item => item.id);

    let query = supabase
      .from('project_checklist_items')
      .delete()
      .eq('project_id', projectId)
      .in('status', ['pending', 'submitted']) // Only clear non-approved questions
      .in('item_id', itemIdArray);

    if (participantDesignation) {
      query = query.eq('participant_designation', participantDesignation);
    }

    return await query;
  }
}
