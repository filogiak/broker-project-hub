
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type RequiredItemInsert = Database['public']['Tables']['required_items']['Insert'];
type RequiredItemUpdate = Database['public']['Tables']['required_items']['Update'];
type ItemOption = Database['public']['Tables']['item_options']['Row'];
type ItemOptionInsert = Database['public']['Tables']['item_options']['Insert'];
type ItemsCategory = Database['public']['Tables']['items_categories']['Row'];

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
  }
};
