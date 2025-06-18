import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type ChecklistItem = Database['public']['Tables']['project_checklist_items']['Row'];

export interface TypedChecklistItem extends ChecklistItem {
  itemId: string;
  itemName: string;
  itemType: string;
  categoryId: string;
  subcategory: string | null;
  subcategory2: string | null;
  subcategory3: string | null;
  subcategory4: string | null;
  subcategory5: string | null;
  subcategory1Initiator: boolean;
  subcategory2Initiator: boolean;
  subcategory3Initiator: boolean;
  subcategory4Initiator: boolean;
  subcategory5Initiator: boolean;
  priority: number | null;
  helpText: string | null;
  placeholderText: string | null;
  required: boolean;
  validationRules: any;
  participantDesignation: string | null;
  // Add repeatable group fields
  repeatable_group_title: string | null;
  repeatable_group_subtitle: string | null;
  repeatable_group_top_button_text: string | null;
  repeatable_group_start_button_text: string | null;
  repeatable_group_target_table: 'project_secondary_incomes' | 'project_dependents' | 'project_debts' | null;
}

export class ChecklistItemService {
  static async getRequiredItems(): Promise<RequiredItem[]> {
    const { data, error } = await supabase
      .from('required_items')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error("Error fetching required items:", error);
      throw new Error(error.message);
    }

    return data || [];
  }

  static async getRequiredItem(id: string): Promise<RequiredItem | null> {
    const { data, error } = await supabase
      .from('required_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching required item with ID ${id}:`, error);
      throw new Error(error.message);
    }

    return data || null;
  }

  static async createRequiredItem(item: Omit<RequiredItem, 'id' | 'created_at'>): Promise<RequiredItem> {
    const { data, error } = await supabase
      .from('required_items')
      .insert([item])
      .select('*')
      .single();

    if (error) {
      console.error("Error creating required item:", error);
      throw new Error(error.message);
    }

    return data;
  }

  static async updateRequiredItem(id: string, updates: Partial<RequiredItem>): Promise<RequiredItem | null> {
    const { data, error } = await supabase
      .from('required_items')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(`Error updating required item with ID ${id}:`, error);
      throw new Error(error.message);
    }

    return data || null;
  }

  static async deleteRequiredItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('required_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting required item with ID ${id}:`, error);
      throw new Error(error.message);
    }
  }

  static async getProjectChecklistItems(projectId: string): Promise<ChecklistItem[]> {
    const { data, error } = await supabase
      .from('project_checklist_items')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error(`Error fetching checklist items for project ID ${projectId}:`, error);
      throw new Error(error.message);
    }

    return data || [];
  }

  static async getProjectChecklistItem(id: string): Promise<ChecklistItem | null> {
    const { data, error } = await supabase
      .from('project_checklist_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching checklist item with ID ${id}:`, error);
      throw new Error(error.message);
    }

    return data || null;
  }

  static async createProjectChecklistItem(item: Omit<ChecklistItem, 'id' | 'created_at'>): Promise<ChecklistItem> {
    const { data, error } = await supabase
      .from('project_checklist_items')
      .insert([item])
      .select('*')
      .single();

    if (error) {
      console.error("Error creating project checklist item:", error);
      throw new Error(error.message);
    }

    return data;
  }

  static async updateProjectChecklistItem(id: string, updates: Partial<ChecklistItem>): Promise<ChecklistItem | null> {
    const { data, error } = await supabase
      .from('project_checklist_items')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(`Error updating project checklist item with ID ${id}:`, error);
      throw new Error(error.message);
    }

    return data || null;
  }

  static async deleteProjectChecklistItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_checklist_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting project checklist item with ID ${id}:`, error);
      throw new Error(error.message);
    }
  }

  static isMainQuestion(item: TypedChecklistItem): boolean {
    // Always include repeatable groups as main questions
    if (item.itemType === 'repeatable_group') {
      return true;
    }

    // Check if item has no subcategory or is an initiator
    const hasNoSubcategory = !item.subcategory && !item.subcategory2 && 
                            !item.subcategory3 && !item.subcategory4 && !item.subcategory5;
    
    const isInitiator = item.subcategory1Initiator ||
                       item.subcategory2Initiator ||
                       item.subcategory3Initiator ||
                       item.subcategory4Initiator ||
                       item.subcategory5Initiator;
    
    return hasNoSubcategory || isInitiator;
  }
}
