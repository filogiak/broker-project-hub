import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ChecklistItem = Database['public']['Tables']['project_checklist_items']['Row'];
type ChecklistItemInsert = Database['public']['Tables']['project_checklist_items']['Insert'];
type ChecklistItemUpdate = Database['public']['Tables']['project_checklist_items']['Update'];
type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type ItemType = Database['public']['Enums']['item_type'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

export interface TypedChecklistItemValue {
  textValue?: string;
  numericValue?: number;
  dateValue?: string;
  booleanValue?: boolean;
  jsonValue?: any;
  documentReferenceId?: string;
}

export interface TypedChecklistItem {
  id: string;
  projectId: string;
  itemId: string;
  participantDesignation?: ParticipantDesignation;
  status: Database['public']['Enums']['checklist_status'];
  createdAt: string;
  updatedAt: string;
  itemName: string;
  itemType: ItemType;
  scope: Database['public']['Enums']['item_scope'];
  categoryId?: string;
  priority?: number;
  displayValue?: string;
  typedValue: TypedChecklistItemValue;
}

export class ChecklistItemService {
  /**
   * Creates a new checklist item with proper type validation
   */
  static async createChecklistItem(
    projectId: string,
    itemId: string,
    value: TypedChecklistItemValue,
    participantDesignation?: ParticipantDesignation
  ): Promise<{ data: ChecklistItem | null; error: any }> {
    const insertData: ChecklistItemInsert = {
      project_id: projectId,
      item_id: itemId,
      participant_designation: participantDesignation,
      text_value: value.textValue,
      numeric_value: value.numericValue,
      date_value: value.dateValue,
      boolean_value: value.booleanValue,
      json_value: value.jsonValue,
      document_reference_id: value.documentReferenceId,
    };

    return await supabase
      .from('project_checklist_items')
      .insert(insertData)
      .select()
      .single();
  }

  /**
   * Updates an existing checklist item with proper type validation
   */
  static async updateChecklistItem(
    itemId: string,
    value: TypedChecklistItemValue,
    status?: Database['public']['Enums']['checklist_status']
  ): Promise<{ data: ChecklistItem | null; error: any }> {
    const updateData: ChecklistItemUpdate = {
      text_value: value.textValue,
      numeric_value: value.numericValue,
      date_value: value.dateValue,
      boolean_value: value.booleanValue,
      json_value: value.jsonValue,
      document_reference_id: value.documentReferenceId,
      status: status,
      updated_at: new Date().toISOString(),
    };

    return await supabase
      .from('project_checklist_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();
  }

  /**
   * Retrieves typed checklist items for a project with proper typing and priority ordering
   */
  static async getProjectChecklistItems(
    projectId: string,
    participantDesignation?: ParticipantDesignation
  ): Promise<{ data: TypedChecklistItem[] | null; error: any }> {
    // Query the project_checklist_items table and join with required_items for metadata
    let query = supabase
      .from('project_checklist_items')
      .select(`
        *,
        required_items (
          item_name,
          item_type,
          scope,
          category_id,
          priority
        )
      `)
      .eq('project_id', projectId);

    if (participantDesignation) {
      query = query.or(`participant_designation.eq.${participantDesignation},participant_designation.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Transform the data to include properly typed values
    const typedData: TypedChecklistItem[] = data?.map(item => {
      const requiredItem = item.required_items as any;
      return {
        id: item.id,
        projectId: item.project_id,
        itemId: item.item_id,
        participantDesignation: item.participant_designation,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        itemName: requiredItem?.item_name || '',
        itemType: requiredItem?.item_type || 'text',
        scope: requiredItem?.scope || 'PROJECT',
        categoryId: requiredItem?.category_id,
        priority: requiredItem?.priority || 0,
        displayValue: this.getDisplayValueFromItem(item, requiredItem?.item_type),
        typedValue: {
          textValue: item.text_value,
          numericValue: item.numeric_value,
          dateValue: item.date_value,
          booleanValue: item.boolean_value,
          jsonValue: item.json_value,
          documentReferenceId: item.document_reference_id,
        },
      };
    }) || [];

    // Sort by priority
    typedData.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    return { data: typedData, error: null };
  }

  /**
   * Gets checklist items by category for a project
   */
  static async getChecklistItemsByCategory(
    projectId: string,
    categoryId: string,
    participantDesignation?: ParticipantDesignation
  ): Promise<{ data: TypedChecklistItem[] | null; error: any }> {
    // Query with category filter directly in the database query for better performance
    let query = supabase
      .from('project_checklist_items')
      .select(`
        *,
        required_items!inner (
          item_name,
          item_type,
          scope,
          category_id,
          priority
        )
      `)
      .eq('project_id', projectId)
      .eq('required_items.category_id', categoryId);

    if (participantDesignation) {
      query = query.or(`participant_designation.eq.${participantDesignation},participant_designation.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Transform the data to include properly typed values
    const typedData: TypedChecklistItem[] = data?.map(item => {
      const requiredItem = item.required_items as any;
      return {
        id: item.id,
        projectId: item.project_id,
        itemId: item.item_id,
        participantDesignation: item.participant_designation,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        itemName: requiredItem?.item_name || '',
        itemType: requiredItem?.item_type || 'text',
        scope: requiredItem?.scope || 'PROJECT',
        categoryId: requiredItem?.category_id,
        priority: requiredItem?.priority || 0,
        displayValue: this.getDisplayValueFromItem(item, requiredItem?.item_type),
        typedValue: {
          textValue: item.text_value,
          numericValue: item.numeric_value,
          dateValue: item.date_value,
          booleanValue: item.boolean_value,
          jsonValue: item.json_value,
          documentReferenceId: item.document_reference_id,
        },
      };
    }) || [];

    // Sort by priority
    typedData.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    return { data: typedData, error: null };
  }

  /**
   * Validates and converts input value based on item type
   */
  static validateAndConvertValue(itemType: ItemType, inputValue: any): TypedChecklistItemValue {
    switch (itemType) {
      case 'text':
      case 'single_choice_dropdown':
        return { textValue: String(inputValue) };
      
      case 'number':
        const numericValue = Number(inputValue);
        if (isNaN(numericValue)) {
          throw new Error(`Invalid numeric value: ${inputValue}`);
        }
        return { numericValue };
      
      case 'date':
        const dateValue = new Date(inputValue).toISOString().split('T')[0];
        if (!dateValue || dateValue === 'Invalid Date') {
          throw new Error(`Invalid date value: ${inputValue}`);
        }
        return { dateValue };
      
      case 'multiple_choice_checkbox':
        if (!Array.isArray(inputValue)) {
          throw new Error(`Multiple choice value must be an array: ${inputValue}`);
        }
        return { jsonValue: inputValue };
      
      case 'document':
        return { documentReferenceId: String(inputValue) };
      
      default:
        throw new Error(`Unsupported item type: ${itemType}`);
    }
  }

  /**
   * Gets the display value from a checklist item based on its type
   */
  private static getDisplayValueFromItem(item: any, itemType: string): string {
    switch (itemType) {
      case 'text':
      case 'single_choice_dropdown':
        return item.text_value || '';
      
      case 'number':
        return item.numeric_value?.toString() || '';
      
      case 'date':
        return item.date_value || '';
      
      case 'multiple_choice_checkbox':
        return Array.isArray(item.json_value) 
          ? item.json_value.join(', ') 
          : '';
      
      case 'document':
        return item.document_reference_id || '';
      
      default:
        return '';
    }
  }

  /**
   * Gets the display value from a typed checklist item
   */
  static getDisplayValue(item: TypedChecklistItem): string {
    const { typedValue, itemType } = item;
    
    switch (itemType) {
      case 'text':
      case 'single_choice_dropdown':
        return typedValue.textValue || '';
      
      case 'number':
        return typedValue.numericValue?.toString() || '';
      
      case 'date':
        return typedValue.dateValue || '';
      
      case 'multiple_choice_checkbox':
        return Array.isArray(typedValue.jsonValue) 
          ? typedValue.jsonValue.join(', ') 
          : '';
      
      case 'document':
        return typedValue.documentReferenceId || '';
      
      default:
        return '';
    }
  }
}
