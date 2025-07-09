
import { supabase } from '@/integrations/supabase/client';

// Type-safe interfaces for each repeatable group table
interface SecondaryIncomeItem {
  id: string;
  project_id: string;
  item_id: string;
  group_index: number;
  participant_designation?: string;
  status?: string;
  text_value?: string;
  numeric_value?: number;
  boolean_value?: boolean;
  date_value?: string;
  json_value?: any;
}

interface DependentItem {
  id: string;
  project_id: string;
  item_id: string;
  group_index: number;
  participant_designation?: string;
  status?: string;
  text_value?: string;
  numeric_value?: number;
  boolean_value?: boolean;
  date_value?: string;
  json_value?: any;
}

interface DebtItem {
  id: string;
  project_id: string;
  item_id: string;
  group_index: number;
  participant_designation?: string;
  status?: string;
  text_value?: string;
  numeric_value?: number;
  boolean_value?: boolean;
  date_value?: string;
  json_value?: any;
}

type RepeatableGroupItem = SecondaryIncomeItem | DependentItem | DebtItem;

export class RepeatableGroupService {
  static async loadGroups(projectId: string, targetTable: string) {
    switch (targetTable) {
      case 'project_secondary_income_items':
        return await supabase
          .from('project_secondary_income_items')
          .select('group_index, id, status')
          .eq('project_id', projectId)
          .order('group_index', { ascending: true });

      case 'project_debt_items':
        return await supabase
          .from('project_debt_items')
          .select('group_index, id, status')
          .eq('project_id', projectId)
          .order('group_index', { ascending: true });

      default:
        throw new Error(`Unsupported table: ${targetTable}`);
    }
  }

  static async getMaxGroupIndex(projectId: string, targetTable: string): Promise<number> {
    let query;
    
    switch (targetTable) {
      case 'project_secondary_income_items':
        query = supabase
          .from('project_secondary_income_items')
          .select('group_index')
          .eq('project_id', projectId)
          .order('group_index', { ascending: false })
          .limit(1);
        break;

      case 'project_debt_items':
        query = supabase
          .from('project_debt_items')
          .select('group_index')
          .eq('project_id', projectId)
          .order('group_index', { ascending: false })
          .limit(1);
        break;

      default:
        throw new Error(`Unsupported table: ${targetTable}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data && data.length > 0 ? data[0].group_index : 0;
  }

  static async loadExistingAnswers(projectId: string, targetTable: string, groupIndex: number) {
    switch (targetTable) {
      case 'project_secondary_income_items':
        return await supabase
          .from('project_secondary_income_items')
          .select('item_id, text_value, numeric_value, boolean_value, date_value, json_value')
          .eq('project_id', projectId)
          .eq('group_index', groupIndex);

      case 'project_debt_items':
        return await supabase
          .from('project_debt_items')
          .select('item_id, text_value, numeric_value, boolean_value, date_value, json_value')
          .eq('project_id', projectId)
          .eq('group_index', groupIndex);

      default:
        throw new Error(`Unsupported table: ${targetTable}`);
    }
  }

  static async saveAnswer(
    projectId: string,
    targetTable: string,
    itemId: string,
    groupIndex: number,
    insertData: any
  ) {
    const baseData = {
      project_id: projectId,
      item_id: itemId,
      group_index: groupIndex,
      status: 'submitted',
      ...insertData
    };

    switch (targetTable) {
      case 'project_secondary_income_items':
        await supabase
          .from('project_secondary_income_items')
          .delete()
          .eq('project_id', projectId)
          .eq('item_id', itemId)
          .eq('group_index', groupIndex);
        
        return await supabase
          .from('project_secondary_income_items')
          .insert(baseData);

      case 'project_debt_items':
        await supabase
          .from('project_debt_items')
          .delete()
          .eq('project_id', projectId)
          .eq('item_id', itemId)
          .eq('group_index', groupIndex);
        
        return await supabase
          .from('project_debt_items')
          .insert(baseData);

      default:
        throw new Error(`Unsupported table: ${targetTable}`);
    }
  }

  static async createNewGroup(projectId: string, targetTable: string): Promise<number> {
    const maxIndex = await this.getMaxGroupIndex(projectId, targetTable);
    return maxIndex + 1;
  }

  static async deleteGroup(projectId: string, targetTable: string, groupIndex: number) {
    switch (targetTable) {
      case 'project_secondary_income_items':
        return await supabase
          .from('project_secondary_income_items')
          .delete()
          .eq('project_id', projectId)
          .eq('group_index', groupIndex);

      case 'project_debt_items':
        return await supabase
          .from('project_debt_items')
          .delete()
          .eq('project_id', projectId)
          .eq('group_index', groupIndex);

      default:
        throw new Error(`Unsupported table: ${targetTable}`);
    }
  }
}
