import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type RequiredItemInsert = Database['public']['Tables']['required_items']['Insert'];
type RequiredItemUpdate = Database['public']['Tables']['required_items']['Update'];
type ItemOption = Database['public']['Tables']['item_options']['Row'];
type ItemOptionInsert = Database['public']['Tables']['item_options']['Insert'];
type ItemsCategory = Database['public']['Tables']['items_categories']['Row'];

interface PriorityUpdate {
  id: string;
  priority: number;
  category_id?: string;
}

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
    // Ensure all subcategory fields are included and convert empty strings to null
    const completeItem = {
      ...item,
      subcategory: item.subcategory?.trim() || null,
      subcategory_2: item.subcategory_2?.trim() || null,
      subcategory_3: item.subcategory_3?.trim() || null,
      subcategory_4: item.subcategory_4?.trim() || null,
      subcategory_5: item.subcategory_5?.trim() || null,
      subcategory_3_initiator: item.subcategory_3_initiator || false,
      subcategory_4_initiator: item.subcategory_4_initiator || false,
      subcategory_5_initiator: item.subcategory_5_initiator || false,
    };

    const { data, error } = await supabase
      .from('required_items')
      .insert(completeItem)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRequiredItem(id: string, updates: RequiredItemUpdate): Promise<RequiredItem> {
    // Ensure all subcategory fields are included in updates and convert empty strings to null
    const completeUpdates = {
      ...updates,
      subcategory: updates.subcategory !== undefined ? (updates.subcategory?.trim() || null) : null,
      subcategory_2: updates.subcategory_2 !== undefined ? (updates.subcategory_2?.trim() || null) : null,
      subcategory_3: updates.subcategory_3 !== undefined ? (updates.subcategory_3?.trim() || null) : null,
      subcategory_4: updates.subcategory_4 !== undefined ? (updates.subcategory_4?.trim() || null) : null,
      subcategory_5: updates.subcategory_5 !== undefined ? (updates.subcategory_5?.trim() || null) : null,
      subcategory_3_initiator: updates.subcategory_3_initiator !== undefined ? updates.subcategory_3_initiator : false,
      subcategory_4_initiator: updates.subcategory_4_initiator !== undefined ? updates.subcategory_4_initiator : false,
      subcategory_5_initiator: updates.subcategory_5_initiator !== undefined ? updates.subcategory_5_initiator : false,
    };

    const { data, error } = await supabase
      .from('required_items')
      .update(completeUpdates)
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

  // Batch update method for priorities
  async batchUpdatePriorities(updates: PriorityUpdate[]): Promise<void> {
    if (updates.length === 0) return;

    // Use a transaction-like approach by updating each item
    const updatePromises = updates.map(({ id, priority, category_id }) => {
      const updateData: RequiredItemUpdate = { priority };
      if (category_id !== undefined) {
        updateData.category_id = category_id;
      }
      
      return supabase
        .from('required_items')
        .update(updateData)
        .eq('id', id);
    });

    const results = await Promise.all(updatePromises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Failed to update ${errors.length} items: ${errors[0].error?.message}`);
    }
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
    await this.deleteAllItemOptions(itemId);

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
  }
};
