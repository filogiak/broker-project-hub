import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProjectChecklistItem = Database['public']['Tables']['project_checklist_items']['Row'];
type ChecklistStatus = Database['public']['Enums']['checklist_status'];
type ItemType = Database['public']['Enums']['item_type'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

export interface TypedChecklistItemValue {
  textValue?: string | null;
  numericValue?: number | null;
  dateValue?: string | null;
  booleanValue?: boolean | null;
  jsonValue?: any | null;
  documentReferenceId?: string | null;
}

export interface TypedChecklistItem {
  id: string;
  projectId: string;
  itemId: string;
  participantDesignation?: ParticipantDesignation | null;
  status: ChecklistStatus;
  createdAt: string;
  updatedAt: string;
  itemName: string;
  itemType: ItemType;
  scope: Database['public']['Enums']['item_scope'];
  categoryId?: string | null;
  priority?: number | null;
  displayValue?: any;
  typedValue: TypedChecklistItemValue;
  
  // New fields for subcategory logic
  subcategory?: string | null;
  subcategory1Initiator?: boolean | null;
  subcategory2Initiator?: boolean | null;
}

export class ChecklistItemService {
  /**
   * Get checklist items for a project category with enhanced subcategory information
   */
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
          required_items!inner (
            item_name,
            item_type,
            scope,
            category_id,
            priority,
            subcategory,
            subcategory_1_initiator,
            subcategory_2_initiator
          )
        `)
        .eq('project_id', projectId)
        .eq('required_items.category_id', categoryId);

      if (participantDesignation) {
        query = query.or(`participant_designation.eq.${participantDesignation},participant_designation.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching checklist items:', error);
        return { data: null, error };
      }

      const typedItems: TypedChecklistItem[] = (data || []).map(item => {
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
          displayValue: this.getDisplayValue({
            typedValue: {
              textValue: item.text_value,
              numericValue: item.numeric_value,
              dateValue: item.date_value,
              booleanValue: item.boolean_value,
              jsonValue: item.json_value,
              documentReferenceId: item.document_reference_id,
            },
            itemType: requiredItem?.item_type || 'text',
          } as TypedChecklistItem),
          typedValue: {
            textValue: item.text_value,
            numericValue: item.numeric_value,
            dateValue: item.date_value,
            booleanValue: item.boolean_value,
            jsonValue: item.json_value,
            documentReferenceId: item.document_reference_id,
          },
          // Enhanced subcategory fields
          subcategory: requiredItem?.subcategory,
          subcategory1Initiator: requiredItem?.subcategory_1_initiator,
          subcategory2Initiator: requiredItem?.subcategory_2_initiator,
        };
      });

      return { data: typedItems, error: null };
    } catch (err) {
      console.error('Exception in getChecklistItemsByCategory:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get all checklist items for a project with enhanced subcategory information
   */
  static async getProjectChecklistItems(
    projectId: string,
    participantDesignation?: ParticipantDesignation
  ): Promise<{ data: TypedChecklistItem[] | null; error: any }> {
    try {
      let query = supabase
        .from('project_checklist_items')
        .select(`
          *,
          required_items!inner (
            item_name,
            item_type,
            scope,
            category_id,
            priority,
            subcategory,
            subcategory_1_initiator,
            subcategory_2_initiator
          )
        `)
        .eq('project_id', projectId);

      if (participantDesignation) {
        query = query.or(`participant_designation.eq.${participantDesignation},participant_designation.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching project checklist items:', error);
        return { data: null, error };
      }

      const typedItems: TypedChecklistItem[] = (data || []).map(item => {
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
          displayValue: this.getDisplayValue({
            typedValue: {
              textValue: item.text_value,
              numericValue: item.numeric_value,
              dateValue: item.date_value,
              booleanValue: item.boolean_value,
              jsonValue: item.json_value,
              documentReferenceId: item.document_reference_id,
            },
            itemType: requiredItem?.item_type || 'text',
          } as TypedChecklistItem),
          typedValue: {
            textValue: item.text_value,
            numericValue: item.numeric_value,
            dateValue: item.date_value,
            booleanValue: item.boolean_value,
            jsonValue: item.json_value,
            documentReferenceId: item.document_reference_id,
          },
          // Enhanced subcategory fields
          subcategory: requiredItem?.subcategory,
          subcategory1Initiator: requiredItem?.subcategory_1_initiator,
          subcategory2Initiator: requiredItem?.subcategory_2_initiator,
        };
      });

      return { data: typedItems, error: null };
    } catch (err) {
      console.error('Exception in getProjectChecklistItems:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Creates a new checklist item with proper type validation
   */
  static async createChecklistItem(
    projectId: string,
    itemId: string,
    value: TypedChecklistItemValue,
    participantDesignation?: ParticipantDesignation
  ): Promise<{ data: any; error: any }> {
    try {
      const insertData: any = {
        project_id: projectId,
        item_id: itemId,
        status: 'pending',
      };

      if (participantDesignation) {
        insertData.participant_designation = participantDesignation;
      }

      // Set the appropriate value field based on the value type
      if (value.textValue !== undefined) insertData.text_value = value.textValue;
      if (value.numericValue !== undefined) insertData.numeric_value = value.numericValue;
      if (value.dateValue !== undefined) insertData.date_value = value.dateValue;
      if (value.booleanValue !== undefined) insertData.boolean_value = value.booleanValue;
      if (value.jsonValue !== undefined) insertData.json_value = value.jsonValue;
      if (value.documentReferenceId !== undefined) insertData.document_reference_id = value.documentReferenceId;

      const { data, error } = await supabase
        .from('project_checklist_items')
        .insert(insertData)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error('Exception in createChecklistItem:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Updates an existing checklist item with proper type validation
   */
  static async updateChecklistItem(
    itemId: string,
    value: TypedChecklistItemValue,
    status?: ChecklistStatus
  ): Promise<{ data: any; error: any }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (status) {
        updateData.status = status;
      }

      // Set the appropriate value field based on the value type
      if (value.textValue !== undefined) updateData.text_value = value.textValue;
      if (value.numericValue !== undefined) updateData.numeric_value = value.numericValue;
      if (value.dateValue !== undefined) updateData.date_value = value.dateValue;
      if (value.booleanValue !== undefined) updateData.boolean_value = value.booleanValue;
      if (value.jsonValue !== undefined) updateData.json_value = value.jsonValue;
      if (value.documentReferenceId !== undefined) updateData.document_reference_id = value.documentReferenceId;

      const { data, error } = await supabase
        .from('project_checklist_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error('Exception in updateChecklistItem:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Validates and converts input value based on item type
   */
  static validateAndConvertValue(itemType: ItemType, inputValue: any): TypedChecklistItemValue {
    const result: TypedChecklistItemValue = {};

    switch (itemType) {
      case 'text':
      case 'single_choice_dropdown':
        result.textValue = inputValue ? String(inputValue) : null;
        break;
      case 'number':
        result.numericValue = inputValue ? Number(inputValue) : null;
        break;
      case 'date':
        result.dateValue = inputValue ? String(inputValue) : null;
        break;
      case 'multiple_choice_checkbox':
        result.jsonValue = Array.isArray(inputValue) ? inputValue : [];
        break;
      case 'document':
        result.documentReferenceId = inputValue ? String(inputValue) : null;
        break;
      default:
        result.textValue = inputValue ? String(inputValue) : null;
    }

    return result;
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
  static getDisplayValue(item: TypedChecklistItem): any {
    const { typedValue, itemType } = item;
    
    switch (itemType) {
      case 'text':
      case 'single_choice_dropdown':
        return typedValue.textValue || '';
      
      case 'number':
        return typedValue.numericValue || '';
      
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

  /**
   * Question classification helper functions
   */
  static isMainQuestion(item: TypedChecklistItem): boolean {
    // Get the required item data
    const requiredItem = item as any;
    
    // Case 1: No subcategory - definitely a main question
    if (!requiredItem.subcategory && !requiredItem.subcategory_2) {
      return true;
    }
    
    // Case 2: Traditional initiator questions
    if (requiredItem.subcategory_1_initiator || requiredItem.subcategory_2_initiator) {
      return true;
    }
    
    // Case 3: Multi-flow initiator questions
    // These are questions that have logic rules but don't belong to any subcategory themselves
    // We need to check if this question is a trigger for any logic rules
    return this.isMultiFlowInitiator(item.itemId);
  }

  /**
   * Check if a question is a multi-flow initiator by looking for logic rules
   */
  static async isMultiFlowInitiator(itemId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('question_logic_rules')
        .select('id')
        .eq('trigger_item_id', itemId)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Error checking multi-flow initiator status:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error in isMultiFlowInitiator:', error);
      return false;
    }
  }

  /**
   * Synchronous version that assumes multi-flow status is already determined
   * This should be used when we have pre-fetched the logic rules information
   */
  static isMainQuestionSync(item: TypedChecklistItem, hasLogicRules: boolean = false): boolean {
    const requiredItem = item as any;
    
    // Case 1: No subcategory - definitely a main question
    if (!requiredItem.subcategory && !requiredItem.subcategory_2) {
      return true;
    }
    
    // Case 2: Traditional initiator questions
    if (requiredItem.subcategory_1_initiator || requiredItem.subcategory_2_initiator) {
      return true;
    }
    
    // Case 3: Multi-flow initiator questions (pre-determined)
    return hasLogicRules;
  }

  /**
   * Transform a raw database item to TypedChecklistItem
   */
  static transformToTypedItem(item: any): TypedChecklistItem {
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
      displayValue: this.getDisplayValue({
        typedValue: {
          textValue: item.text_value,
          numericValue: item.numeric_value,
          dateValue: item.date_value,
          booleanValue: item.boolean_value,
          jsonValue: item.json_value,
          documentReferenceId: item.document_reference_id,
        },
        itemType: requiredItem?.item_type || 'text',
      } as TypedChecklistItem),
      typedValue: {
        textValue: item.text_value,
        numericValue: item.numeric_value,
        dateValue: item.date_value,
        booleanValue: item.boolean_value,
        jsonValue: item.json_value,
        documentReferenceId: item.document_reference_id,
      },
      // Enhanced subcategory fields
      subcategory: requiredItem?.subcategory,
      subcategory1Initiator: requiredItem?.subcategory_1_initiator,
      subcategory2Initiator: requiredItem?.subcategory_2_initiator,
    };
  }

  /**
   * Enhanced method to get main questions with proper multi-flow support
   */
  static async getMainQuestionsWithLogicInfo(
    projectId: string,
    categoryId: string,
    participantDesignation?: Database['public']['Enums']['participant_designation']
  ): Promise<TypedChecklistItem[]> {
    try {
      // Get all checklist items for the category
      let query = supabase
        .from('project_checklist_items')
        .select(`
          *,
          required_items!inner (
            id,
            item_name,
            item_type,
            scope,
            category_id,
            priority,
            subcategory,
            subcategory_2,
            subcategory_1_initiator,
            subcategory_2_initiator
          )
        `)
        .eq('project_id', projectId)
        .eq('required_items.category_id', categoryId);

      if (participantDesignation) {
        query = query.or(`participant_designation.eq.${participantDesignation},participant_designation.is.null`);
      }

      const { data: items, error } = await query;

      if (error) {
        console.error('Error fetching checklist items:', error);
        return [];
      }

      if (!items) return [];

      // Get logic rules for all items to determine multi-flow initiators
      const itemIds = items.map(item => (item.required_items as any).id);
      const { data: logicRules } = await supabase
        .from('question_logic_rules')
        .select('trigger_item_id')
        .in('trigger_item_id', itemIds)
        .eq('is_active', true);

      const multiFlowInitiatorIds = new Set(logicRules?.map(rule => rule.trigger_item_id) || []);

      // Transform and filter main questions
      const typedItems = items.map(item => this.transformToTypedItem(item));
      
      return typedItems.filter(item => {
        const hasLogicRules = multiFlowInitiatorIds.has(item.itemId);
        return this.isMainQuestionSync(item, hasLogicRules);
      });

    } catch (error) {
      console.error('Error in getMainQuestionsWithLogicInfo:', error);
      return [];
    }
  }
}
