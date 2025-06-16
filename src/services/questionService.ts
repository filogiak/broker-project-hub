
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type RequiredItemInsert = Database['public']['Tables']['required_items']['Insert'];
type RequiredItemUpdate = Database['public']['Tables']['required_items']['Update'];
type ItemOption = Database['public']['Tables']['item_options']['Row'];
type ItemOptionInsert = Database['public']['Tables']['item_options']['Insert'];
type ItemsCategory = Database['public']['Tables']['items_categories']['Row'];
type LogicRule = Database['public']['Tables']['question_logic_rules']['Row'];
type LogicRuleInsert = Database['public']['Tables']['question_logic_rules']['Insert'];

export const questionService = {
  // Items Categories (renamed from Document Categories)
  async getItemsCategories(): Promise<ItemsCategory[]> {
    const { data, error } = await supabase
      .from('items_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Required Items (Questions)
  async getRequiredItems(): Promise<RequiredItem[]> {
    const { data, error } = await supabase
      .from('required_items')
      .select(`
        *,
        items_categories(name),
        item_options(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getRequiredItemById(id: string): Promise<RequiredItem | null> {
    const { data, error } = await supabase
      .from('required_items')
      .select(`
        *,
        items_categories(name),
        item_options(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async createRequiredItem(item: RequiredItemInsert): Promise<RequiredItem> {
    const { data, error } = await supabase
      .from('required_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRequiredItem(id: string, updates: RequiredItemUpdate): Promise<RequiredItem> {
    const { data, error } = await supabase
      .from('required_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRequiredItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('required_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Item Options
  async getItemOptions(itemId: string): Promise<ItemOption[]> {
    const { data, error } = await supabase
      .from('item_options')
      .select('*')
      .eq('item_id', itemId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createItemOption(option: ItemOptionInsert): Promise<ItemOption> {
    const { data, error } = await supabase
      .from('item_options')
      .insert(option)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateItemOption(id: string, updates: Partial<ItemOption>): Promise<ItemOption> {
    const { data, error } = await supabase
      .from('item_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteItemOption(id: string): Promise<void> {
    const { error } = await supabase
      .from('item_options')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteAllItemOptions(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('item_options')
      .delete()
      .eq('item_id', itemId);

    if (error) throw error;
  },

  // Batch operations for options
  async replaceItemOptions(itemId: string, options: Omit<ItemOptionInsert, 'item_id'>[]): Promise<void> {
    // Delete existing options
    await this.deleteAllItemOptions(itemId);

    // Insert new options if any
    if (options.length > 0) {
      const optionsWithItemId = options.map(option => ({
        ...option,
        item_id: itemId
      }));

      const { error } = await supabase
        .from('item_options')
        .insert(optionsWithItemId);

      if (error) throw error;
    }
  },

  // Logic Rules Management
  async getLogicRules(triggerItemId?: string): Promise<LogicRule[]> {
    let query = supabase
      .from('question_logic_rules')
      .select('*')
      .order('created_at', { ascending: true });

    if (triggerItemId) {
      query = query.eq('trigger_item_id', triggerItemId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createLogicRule(rule: LogicRuleInsert): Promise<LogicRule> {
    const { data, error } = await supabase
      .from('question_logic_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLogicRule(id: string, updates: Partial<LogicRule>): Promise<LogicRule> {
    const { data, error } = await supabase
      .from('question_logic_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteLogicRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('question_logic_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async clearLogicRules(triggerItemId: string): Promise<void> {
    const { error } = await supabase
      .from('question_logic_rules')
      .delete()
      .eq('trigger_item_id', triggerItemId);

    if (error) throw error;
  },

  // Multi-Flow Logic Support
  async createMultiFlowLogicRules(triggerItemId: string, flows: Array<{
    answerValue: string;
    targetSubcategory: string;
    targetCategoryId?: string;
  }>): Promise<void> {
    // Clear existing rules first
    await this.clearLogicRules(triggerItemId);

    // Create new rules for each flow
    const rules: LogicRuleInsert[] = flows.map(flow => ({
      trigger_item_id: triggerItemId,
      trigger_value: flow.answerValue,
      target_subcategory: flow.targetSubcategory,
      target_category_id: flow.targetCategoryId,
      is_active: true
    }));

    if (rules.length > 0) {
      const { error } = await supabase
        .from('question_logic_rules')
        .insert(rules);

      if (error) throw error;
    }
  },

  async getMultiFlowLogicRules(triggerItemId: string): Promise<Array<{
    id: string;
    answerValue: string;
    targetSubcategory: string;
  }>> {
    const rules = await this.getLogicRules(triggerItemId);
    
    return rules.map(rule => ({
      id: rule.id,
      answerValue: rule.trigger_value,
      targetSubcategory: rule.target_subcategory
    }));
  }
};
