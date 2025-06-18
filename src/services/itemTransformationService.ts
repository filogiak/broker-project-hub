
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type RequiredItem = Database['public']['Tables']['required_items']['Row'];

// Interface for transformed required item with camelCase fields
export interface TransformedRequiredItem extends Omit<RequiredItem, 'repeatable_group_title' | 'repeatable_group_subtitle' | 'repeatable_group_start_button_text' | 'repeatable_group_top_button_text' | 'repeatable_group_target_table'> {
  repeatableGroupTitle?: string;
  repeatableGroupSubtitle?: string;
  repeatableGroupStartButtonText?: string;
  repeatableGroupTopButtonText?: string;
  repeatableGroupTargetTable?: string;
}

export class ItemTransformationService {
  /**
   * Transform snake_case database fields to camelCase for frontend compatibility
   */
  static transformRequiredItem(item: RequiredItem): TransformedRequiredItem {
    console.log('🔄 ItemTransformationService: Transforming required item:', {
      id: item.id,
      item_name: item.item_name,
      original_target_table: item.repeatable_group_target_table,
      item_type: item.item_type
    });

    const transformed: TransformedRequiredItem = {
      ...item,
      repeatableGroupTitle: item.repeatable_group_title || undefined,
      repeatableGroupSubtitle: item.repeatable_group_subtitle || undefined,
      repeatableGroupStartButtonText: item.repeatable_group_start_button_text || undefined,
      repeatableGroupTopButtonText: item.repeatable_group_top_button_text || undefined,
      repeatableGroupTargetTable: item.repeatable_group_target_table || undefined,
    };

    // Remove the snake_case properties to avoid confusion
    delete (transformed as any).repeatable_group_title;
    delete (transformed as any).repeatable_group_subtitle;
    delete (transformed as any).repeatable_group_start_button_text;
    delete (transformed as any).repeatable_group_top_button_text;
    delete (transformed as any).repeatable_group_target_table;

    console.log('✅ ItemTransformationService: Transformed item:', {
      id: transformed.id,
      item_name: transformed.item_name,
      transformed_target_table: transformed.repeatableGroupTargetTable,
      item_type: transformed.item_type
    });

    return transformed;
  }

  /**
   * Get a single required item by ID with transformation applied
   */
  static async getRequiredItemById(itemId: string): Promise<TransformedRequiredItem | null> {
    console.log('📝 ItemTransformationService: Fetching required item by ID:', itemId);
    
    const { data: item, error } = await supabase
      .from('required_items')
      .select('*')
      .eq('id', itemId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching required item:', error);
      throw new Error(`Failed to fetch required item: ${error.message}`);
    }

    if (!item) {
      console.log('⚠️ No required item found with ID:', itemId);
      return null;
    }

    return this.transformRequiredItem(item);
  }

  /**
   * Get all required items with transformation applied
   */
  static async getAllRequiredItems(): Promise<TransformedRequiredItem[]> {
    console.log('📝 ItemTransformationService: Fetching all required items...');
    
    const { data: allItems, error: itemsError } = await supabase
      .from('required_items')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true });

    if (itemsError) {
      throw new Error(`Failed to fetch required items: ${itemsError.message}`);
    }

    const transformedItems = (allItems || []).map(item => this.transformRequiredItem(item));
    
    console.log(`📝 ItemTransformationService: Total items transformed: ${transformedItems.length}`);
    console.log('🔍 Repeatable group items found:', transformedItems.filter(item => item.item_type === 'repeatable_group').map(item => ({
      id: item.id,
      name: item.item_name,
      targetTable: item.repeatableGroupTargetTable
    })));
    
    return transformedItems;
  }
}
