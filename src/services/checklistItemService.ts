import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ChecklistItem = Database['public']['Tables']['project_checklist_items']['Row'];
type ChecklistItemInsert = Database['public']['Tables']['project_checklist_items']['Insert'];
type ChecklistItemUpdate = Database['public']['Tables']['project_checklist_items']['Update'];
type ItemType = Database['public']['Enums']['item_type'];
type ChecklistStatus = Database['public']['Enums']['checklist_status'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

export type TypedChecklistItemValue = string | number | boolean | Date | string[] | null;

export interface TypedChecklistItem {
  id: string;
  itemId: string;
  itemName: string;
  itemType: ItemType;
  scope: string;
  status: ChecklistStatus;
  displayValue?: TypedChecklistItemValue;
  priority?: number;
  categoryId: string;
  participantDesignation?: ParticipantDesignation;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItemResult<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export class ChecklistItemService {
  /**
   * Get project checklist items for a specific participant
   */
  static async getProjectChecklistItems(
    projectId: string,
    participantDesignation?: ParticipantDesignation
  ): Promise<ChecklistItemResult<TypedChecklistItem[]>> {
    try {
      let query = supabase
        .from('project_checklist_items')
        .select(`
          *,
          required_items (
            item_name,
            item_type,
            scope,
            priority,
            category_id
          )
        `)
        .eq('project_id', projectId);

      if (participantDesignation) {
        query = query.eq('participant_designation', participantDesignation);
      }

      const { data, error } = await query;

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      const typedItems: TypedChecklistItem[] = (data || [])
        .filter(item => item.required_items)
        .map(item => ({
          id: item.id,
          itemId: item.item_id,
          itemName: item.required_items!.item_name,
          itemType: item.required_items!.item_type,
          scope: item.required_items!.scope,
          status: item.status || 'pending',
          displayValue: this.getDisplayValue(item),
          priority: item.required_items!.priority,
          categoryId: item.required_items!.category_id || '',
          participantDesignation: item.participant_designation || undefined,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

      return { data: typedItems };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Get checklist items by category for a specific participant
   */
  static async getChecklistItemsByCategory(
    projectId: string,
    categoryId: string,
    participantDesignation?: ParticipantDesignation
  ): Promise<ChecklistItemResult<TypedChecklistItem[]>> {
    try {
      let query = supabase
        .from('project_checklist_items')
        .select(`
          *,
          required_items (
            item_name,
            item_type,
            scope,
            priority,
            category_id,
            subcategory,
            subcategory_2,
            subcategory_3,
            subcategory_4,
            subcategory_5,
            subcategory_1_initiator,
            subcategory_2_initiator,
            subcategory_3_initiator,
            subcategory_4_initiator,
            subcategory_5_initiator
          )
        `)
        .eq('project_id', projectId)
        .eq('required_items.category_id', categoryId);

      if (participantDesignation) {
        query = query.eq('participant_designation', participantDesignation);
      }

      const { data, error } = await query;

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      const typedItems: TypedChecklistItem[] = (data || [])
        .filter(item => item.required_items)
        .map(item => ({
          id: item.id,
          itemId: item.item_id,
          itemName: item.required_items!.item_name,
          itemType: item.required_items!.item_type,
          scope: item.required_items!.scope,
          status: item.status || 'pending',
          displayValue: this.getDisplayValue(item),
          priority: item.required_items!.priority,
          categoryId: item.required_items!.category_id || '',
          participantDesignation: item.participant_designation || undefined,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

      return { data: typedItems };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * UPDATED: Enhanced question classification logic for 5 subcategories
   */
  static isMainQuestion(item: TypedChecklistItem): boolean {
    // A main question has no subcategories at all
    return true; // For now, we'll treat all items as main questions in the category view
  }

  static isInitiatorQuestion(item: any): boolean {
    // Check if any of the 5 initiator flags are true
    return !!(item.subcategory_1_initiator || 
             item.subcategory_2_initiator || 
             item.subcategory_3_initiator || 
             item.subcategory_4_initiator || 
             item.subcategory_5_initiator);
  }

  static isConditionalQuestion(item: any): boolean {
    // Has any subcategory but is not an initiator
    const hasAnySubcategory = !!(item.subcategory || 
                               item.subcategory_2 || 
                               item.subcategory_3 || 
                               item.subcategory_4 || 
                               item.subcategory_5);
    
    const isInitiator = this.isInitiatorQuestion(item);
    
    return hasAnySubcategory && !isInitiator;
  }

  /**
   * Create a new checklist item
   */
  static async createChecklistItem(
    projectId: string,
    itemId: string,
    value: TypedChecklistItemValue,
    participantDesignation?: ParticipantDesignation
  ): Promise<ChecklistItemResult<TypedChecklistItem>> {
    try {
      const insertData: ChecklistItemInsert = {
        project_id: projectId,
        item_id: itemId,
        participant_designation: participantDesignation,
        status: 'pending',
      };

      // Set the appropriate value field
      this.setValueFields(insertData, value);

      const { data, error } = await supabase
        .from('project_checklist_items')
        .insert(insertData)
        .select(`
          *,
          required_items (
            item_name,
            item_type,
            scope,
            priority,
            category_id
          )
        `)
        .single();

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      if (!data.required_items) {
        return { error: { message: 'Required item data not found' } };
      }

      const typedItem: TypedChecklistItem = {
        id: data.id,
        itemId: data.item_id,
        itemName: data.required_items.item_name,
        itemType: data.required_items.item_type,
        scope: data.required_items.scope,
        status: data.status || 'pending',
        displayValue: this.getDisplayValue(data),
        priority: data.required_items.priority,
        categoryId: data.required_items.category_id || '',
        participantDesignation: data.participant_designation || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { data: typedItem };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Update an existing checklist item
   */
  static async updateChecklistItem(
    itemId: string,
    value: TypedChecklistItemValue,
    status?: ChecklistStatus
  ): Promise<ChecklistItemResult<TypedChecklistItem>> {
    try {
      const updateData: ChecklistItemUpdate = {};

      // Set the appropriate value field
      this.setValueFields(updateData, value);

      if (status) {
        updateData.status = status;
      }

      const { data, error } = await supabase
        .from('project_checklist_items')
        .update(updateData)
        .eq('id', itemId)
        .select(`
          *,
          required_items (
            item_name,
            item_type,
            scope,
            priority,
            category_id
          )
        `)
        .single();

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      if (!data.required_items) {
        return { error: { message: 'Required item data not found' } };
      }

      const typedItem: TypedChecklistItem = {
        id: data.id,
        itemId: data.item_id,
        itemName: data.required_items.item_name,
        itemType: data.required_items.item_type,
        scope: data.required_items.scope,
        status: data.status || 'pending',
        displayValue: this.getDisplayValue(data),
        priority: data.required_items.priority,
        categoryId: data.required_items.category_id || '',
        participantDesignation: data.participant_designation || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { data: typedItem };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  private static setValueFields(
    data: ChecklistItemInsert | ChecklistItemUpdate,
    value: TypedChecklistItemValue
  ): void {
    // Clear all value fields first
    data.text_value = null;
    data.numeric_value = null;
    data.date_value = null;
    data.boolean_value = null;
    data.json_value = null;
    data.value = null;

    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      data.text_value = value;
      data.value = value;
    } else if (typeof value === 'number') {
      data.numeric_value = value;
      data.value = value.toString();
    } else if (typeof value === 'boolean') {
      data.boolean_value = value;
      data.value = value.toString();
    } else if (value instanceof Date) {
      data.date_value = value.toISOString().split('T')[0];
      data.value = data.date_value;
    } else if (Array.isArray(value)) {
      data.json_value = value;
      data.value = JSON.stringify(value);
    }
  }

  static getDisplayValue(item: ChecklistItem): TypedChecklistItemValue {
    if (item.json_value) {
      return item.json_value as string[];
    }
    if (item.boolean_value !== null) {
      return item.boolean_value;
    }
    if (item.numeric_value !== null) {
      return item.numeric_value;
    }
    if (item.date_value) {
      return new Date(item.date_value);
    }
    if (item.text_value) {
      return item.text_value;
    }
    return null;
  }

  static validateAndConvertValue(itemType: ItemType, inputValue: any): TypedChecklistItemValue {
    if (inputValue === null || inputValue === undefined || inputValue === '') {
      return null;
    }

    switch (itemType) {
      case 'text':
        return String(inputValue);

      case 'number':
        const numValue = Number(inputValue);
        if (isNaN(numValue)) {
          throw new Error('Invalid number value');
        }
        return numValue;

      case 'date':
        if (inputValue instanceof Date) {
          return inputValue;
        }
        const dateValue = new Date(inputValue);
        if (isNaN(dateValue.getTime())) {
          throw new Error('Invalid date value');
        }
        return dateValue;

      case 'single_choice_dropdown':
        return String(inputValue);

      case 'multiple_choice_checkbox':
        if (Array.isArray(inputValue)) {
          return inputValue.map(v => String(v));
        }
        return [String(inputValue)];

      default:
        return String(inputValue);
    }
  }
}
