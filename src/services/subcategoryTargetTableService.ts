import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type RepeatableGroupTargetTable = Database['public']['Enums']['repeatable_group_target_table'];

export class SubcategoryTargetTableService {
  /**
   * Find the target table for a subcategory by looking at its initiator question
   */
  static async getTargetTableForSubcategory(subcategory: string): Promise<RepeatableGroupTargetTable | null> {
    console.log('🔍 Looking for target table for subcategory:', subcategory);
    
    const { data: initiatorItems, error } = await supabase
      .from('required_items')
      .select('repeatable_group_target_table')
      .eq('subcategory', subcategory)
      .eq('subcategory_1_initiator', true)
      .eq('item_type', 'repeatable_group')
      .not('repeatable_group_target_table', 'is', null)
      .limit(1);

    if (error) {
      console.error('❌ Error finding initiator for subcategory:', error);
      return null;
    }

    if (initiatorItems && initiatorItems.length > 0) {
      const targetTable = initiatorItems[0].repeatable_group_target_table as RepeatableGroupTargetTable;
      console.log('✅ Found target table for subcategory', subcategory, ':', targetTable);
      return targetTable;
    }

    console.log('⚠️ No initiator found for subcategory:', subcategory);
    return null;
  }

  /**
   * Auto-assign target table based on subcategory initiator
   */
  static async autoAssignTargetTable(itemData: Partial<RequiredItem>): Promise<RepeatableGroupTargetTable | undefined> {
    // Only apply to repeatable group items
    if (itemData.item_type !== 'repeatable_group') {
      return undefined;
    }

    // If target table is already set, don't override it
    if (itemData.repeatable_group_target_table) {
      return itemData.repeatable_group_target_table as RepeatableGroupTargetTable;
    }

    // If this is an initiator question, keep its target table as-is
    if (itemData.subcategory_1_initiator) {
      return itemData.repeatable_group_target_table as RepeatableGroupTargetTable;
    }

    // If item has a subcategory, try to find the target table from its initiator
    if (itemData.subcategory) {
      const targetTable = await this.getTargetTableForSubcategory(itemData.subcategory);
      if (targetTable) {
        console.log('🎯 Auto-assigning target table', targetTable, 'to item with subcategory', itemData.subcategory);
        return targetTable;
      }
    }

    return undefined;
  }
}
