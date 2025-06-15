
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
   * Evaluate form data against logic rules to determine which subcategories should be shown
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
        // Find the form field ID that corresponds to this rule's trigger item
        const formFieldId = itemIdToFormIdMap[rule.triggerItemId];
        if (!formFieldId) continue;

        const currentValue = formData[formFieldId];
        
        // Check if the current value matches the trigger value
        if (this.valuesMatch(currentValue, rule.triggerValue)) {
          activeSubcategories.push(rule.targetSubcategory);
        }
      }

      return {
        subcategories: [...new Set(activeSubcategories)], // Remove duplicates
        targetCategoryId: categoryId,
      };
    } catch (error) {
      console.error('Error evaluating conditional logic:', error);
      return { subcategories: [] };
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
   * Get additional questions based on active subcategories
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
    let query = supabase
      .from('project_checklist_items')
      .delete()
      .eq('project_id', projectId)
      .in('status', ['pending', 'draft']) // Only clear non-submitted questions
      .in(
        'item_id',
        supabase
          .from('required_items')
          .select('id')
          .eq('category_id', categoryId)
          .not('subcategory', 'is', null)
      );

    if (participantDesignation) {
      query = query.eq('participant_designation', participantDesignation);
    }

    return await query;
  }
}
