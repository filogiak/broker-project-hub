
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type ChecklistItem = Database['public']['Tables']['project_checklist_items']['Row'];
type ChecklistStatus = Database['public']['Enums']['checklist_status'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

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
  displayValue: any;
  // Add repeatable group fields
  repeatable_group_title: string | null;
  repeatable_group_subtitle: string | null;
  repeatable_group_top_button_text: string | null;
  repeatable_group_start_button_text: string | null;
  repeatable_group_target_table: 'project_secondary_incomes' | 'project_dependents' | 'project_debts' | null;
}

export type TypedChecklistItemValue = string | number | boolean | Date | any;

export interface TypedValueResult {
  textValue?: string | null;
  numericValue?: number | null;
  dateValue?: Date | null;
  booleanValue?: boolean | null;
  jsonValue?: any;
  documentReferenceId?: string | null;
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

  static async getProjectChecklistItems(projectId: string, participantDesignation?: ParticipantDesignation): Promise<{ data: TypedChecklistItem[] | null; error: any }> {
    try {
      let query = supabase
        .from('project_checklist_items')
        .select(`
          *,
          required_items!inner(*)
        `)
        .eq('project_id', projectId);

      if (participantDesignation) {
        query = query.eq('participant_designation', participantDesignation);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching checklist items for project ID ${projectId}:`, error);
        return { data: null, error };
      }

      const typedItems = data?.map(item => this.mapToTypedChecklistItem(item)) || [];
      return { data: typedItems, error: null };
    } catch (error) {
      console.error('Unexpected error in getProjectChecklistItems:', error);
      return { data: null, error };
    }
  }

  static async getChecklistItemsByCategory(
    projectId: string,
    categoryId: string,
    participantDesignation?: ParticipantDesignation
  ): Promise<{ data: TypedChecklistItem[] | null; error: any }> {
    try {
      let query = supabase
        .from('project_checklist_items')
        .select(`
          *,
          required_items!inner(*)
        `)
        .eq('project_id', projectId)
        .eq('required_items.category_id', categoryId);

      if (participantDesignation) {
        query = query.eq('participant_designation', participantDesignation);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching checklist items for category ${categoryId}:`, error);
        return { data: null, error };
      }

      const typedItems = data?.map(item => this.mapToTypedChecklistItem(item)) || [];
      return { data: typedItems, error: null };
    } catch (error) {
      console.error('Unexpected error in getChecklistItemsByCategory:', error);
      return { data: null, error };
    }
  }

  static async createChecklistItem(
    projectId: string,
    itemId: string,
    value: TypedChecklistItemValue,
    participantDesignation?: ParticipantDesignation
  ): Promise<{ data: any; error: any }> {
    try {
      const typedValues = this.convertToTypedValues(value);
      
      const insertData: any = {
        project_id: projectId,
        item_id: itemId,
        status: 'pending' as ChecklistStatus,
        ...typedValues
      };

      if (participantDesignation) {
        insertData.participant_designation = participantDesignation;
      }

      const { data, error } = await supabase
        .from('project_checklist_items')
        .insert([insertData])
        .select('*')
        .single();

      if (error) {
        console.error("Error creating checklist item:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error in createChecklistItem:', error);
      return { data: null, error };
    }
  }

  static async updateChecklistItem(
    itemId: string,
    value: TypedChecklistItemValue,
    status?: ChecklistStatus
  ): Promise<{ data: any; error: any }> {
    try {
      const typedValues = this.convertToTypedValues(value);
      
      const updateData: any = {
        ...typedValues,
        updated_at: new Date().toISOString()
      };

      if (status) {
        updateData.status = status;
      }

      const { data, error } = await supabase
        .from('project_checklist_items')
        .update(updateData)
        .eq('id', itemId)
        .select('*')
        .single();

      if (error) {
        console.error(`Error updating checklist item with ID ${itemId}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error in updateChecklistItem:', error);
      return { data: null, error };
    }
  }

  static validateAndConvertValue(itemType: Database['public']['Enums']['item_type'], inputValue: any): TypedChecklistItemValue {
    if (inputValue === null || inputValue === undefined || inputValue === '') {
      return null;
    }

    switch (itemType) {
      case 'text':
        return String(inputValue);
      case 'number':
        const numValue = Number(inputValue);
        if (isNaN(numValue)) {
          throw new Error('Invalid number format');
        }
        return numValue;
      case 'date':
        if (inputValue instanceof Date) {
          return inputValue;
        }
        const dateValue = new Date(inputValue);
        if (isNaN(dateValue.getTime())) {
          throw new Error('Invalid date format');
        }
        return dateValue;
      case 'single_choice_dropdown':
        return String(inputValue);
      case 'multiple_choice_checkbox':
        if (Array.isArray(inputValue)) {
          return inputValue;
        }
        return [inputValue];
      case 'document':
        return String(inputValue);
      case 'repeatable_group':
        return inputValue;
      default:
        return inputValue;
    }
  }

  static convertToTypedValues(value: TypedChecklistItemValue): TypedValueResult {
    if (value === null || value === undefined) {
      return {};
    }

    if (typeof value === 'string') {
      return { text_value: value };
    }
    
    if (typeof value === 'number') {
      return { numeric_value: value };
    }
    
    if (typeof value === 'boolean') {
      return { boolean_value: value };
    }
    
    if (value instanceof Date) {
      return { date_value: value.toISOString().split('T')[0] };
    }
    
    if (Array.isArray(value) || typeof value === 'object') {
      return { json_value: value };
    }

    return { text_value: String(value) };
  }

  static getDisplayValue(item: TypedChecklistItem): any {
    if (item.text_value) return item.text_value;
    if (item.numeric_value !== null && item.numeric_value !== undefined) return item.numeric_value;
    if (item.date_value) return item.date_value;
    if (item.boolean_value !== null && item.boolean_value !== undefined) return item.boolean_value;
    if (item.json_value) return item.json_value;
    if (item.value) return item.value;
    return '';
  }

  static mapToTypedChecklistItem(item: any): TypedChecklistItem {
    const requiredItem = item.required_items;
    
    return {
      ...item,
      itemId: requiredItem.id,
      itemName: requiredItem.item_name,
      itemType: requiredItem.item_type,
      categoryId: requiredItem.category_id,
      subcategory: requiredItem.subcategory,
      subcategory2: requiredItem.subcategory_2,
      subcategory3: requiredItem.subcategory_3,
      subcategory4: requiredItem.subcategory_4,
      subcategory5: requiredItem.subcategory_5,
      subcategory1Initiator: requiredItem.subcategory_1_initiator,
      subcategory2Initiator: requiredItem.subcategory_2_initiator,
      subcategory3Initiator: requiredItem.subcategory_3_initiator,
      subcategory4Initiator: requiredItem.subcategory_4_initiator,
      subcategory5Initiator: requiredItem.subcategory_5_initiator,
      priority: requiredItem.priority,
      helpText: requiredItem.help_text,
      placeholderText: requiredItem.placeholder_text,
      required: requiredItem.required || false,
      validationRules: requiredItem.validation_rules,
      repeatable_group_title: requiredItem.repeatable_group_title,
      repeatable_group_subtitle: requiredItem.repeatable_group_subtitle,
      repeatable_group_top_button_text: requiredItem.repeatable_group_top_button_text,
      repeatable_group_start_button_text: requiredItem.repeatable_group_start_button_text,
      repeatable_group_target_table: requiredItem.repeatable_group_target_table,
      displayValue: this.getDisplayValue(item)
    };
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
