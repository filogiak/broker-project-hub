
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

// Simple service that mirrors project_checklist_items pattern exactly
export class SimpleRepeatableGroupService {
  
  // Get the next available group index for a project and participant
  static async getNextGroupIndex(
    projectId: string, 
    targetTable: string, 
    participantDesignation?: ParticipantDesignation
  ): Promise<number> {
    let query;
    
    const buildQuery = (baseQuery: any) => {
      if (participantDesignation) {
        return baseQuery.eq('participant_designation', participantDesignation);
      }
      return baseQuery.is('participant_designation', null);
    };
    
    switch (targetTable) {
      case 'project_secondary_income_items':
        query = buildQuery(
          supabase
            .from('project_secondary_income_items')
            .select('group_index')
            .eq('project_id', projectId)
        );
        break;

      case 'project_dependent_items':
        query = buildQuery(
          supabase
            .from('project_dependent_items')
            .select('group_index')
            .eq('project_id', projectId)
        );
        break;

      case 'project_debt_items':
        query = buildQuery(
          supabase
            .from('project_debt_items')
            .select('group_index')
            .eq('project_id', projectId)
        );
        break;

      default:
        throw new Error(`Unsupported table: ${targetTable}`);
    }

    query = query.order('group_index', { ascending: false }).limit(1);
    const { data, error } = await query;
    if (error) throw error;
    
    return data && data.length > 0 ? data[0].group_index + 1 : 1;
  }

  // Load all groups for a project and participant (mirrors project_checklist_items loading)
  static async loadAllGroups(
    projectId: string, 
    targetTable: string, 
    participantDesignation?: ParticipantDesignation
  ) {
    const buildQuery = (baseQuery: any) => {
      if (participantDesignation) {
        return baseQuery.eq('participant_designation', participantDesignation);
      }
      return baseQuery.is('participant_designation', null);
    };
    
    switch (targetTable) {
      case 'project_secondary_income_items':
        return await buildQuery(
          supabase
            .from('project_secondary_income_items')
            .select('group_index, item_id, status, text_value, numeric_value, boolean_value, date_value, json_value')
            .eq('project_id', projectId)
        ).order('group_index', { ascending: true });

      case 'project_dependent_items':
        return await buildQuery(
          supabase
            .from('project_dependent_items')
            .select('group_index, item_id, status, text_value, numeric_value, boolean_value, date_value, json_value')
            .eq('project_id', projectId)
        ).order('group_index', { ascending: true });

      case 'project_debt_items':
        return await buildQuery(
          supabase
            .from('project_debt_items')
            .select('group_index, item_id, status, text_value, numeric_value, boolean_value, date_value, json_value')
            .eq('project_id', projectId)
        ).order('group_index', { ascending: true });

      default:
        throw new Error(`Unsupported table: ${targetTable}`);
    }
  }

  // Create a new group (mirrors project_checklist_items creation)
  static async createNewGroup(
    projectId: string, 
    targetTable: string, 
    subcategory: string, 
    participantDesignation?: ParticipantDesignation
  ) {
    // Get next group index scoped to participant
    const groupIndex = await this.getNextGroupIndex(projectId, targetTable, participantDesignation);
    
    // Get all questions for this subcategory (same as project_checklist_items)
    const { data: questions, error: questionsError } = await supabase
      .from('required_items')
      .select('id, item_name, item_type')
      .eq('subcategory', subcategory)
      .neq('item_type', 'repeatable_group')
      .order('priority', { ascending: true });

    if (questionsError) throw questionsError;

    // Create entries for each question (mirrors project_checklist_items pattern)
    const createPromises = questions?.map(async (question) => {
      const baseData = {
        project_id: projectId,
        item_id: question.id,
        group_index: groupIndex,
        status: 'pending' as const,
        participant_designation: participantDesignation || null
      };

      switch (targetTable) {
        case 'project_secondary_income_items':
          return await supabase
            .from('project_secondary_income_items')
            .insert(baseData);

        case 'project_dependent_items':
          return await supabase
            .from('project_dependent_items')
            .insert(baseData);

        case 'project_debt_items':
          return await supabase
            .from('project_debt_items')
            .insert(baseData);

        default:
          throw new Error(`Unsupported table: ${targetTable}`);
      }
    }) || [];

    const results = await Promise.all(createPromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw errors[0].error;
    }

    return groupIndex;
  }

  // Save answer (mirrors project_checklist_items saving exactly)
  static async saveAnswer(
    projectId: string,
    targetTable: string,
    itemId: string,
    groupIndex: number,
    value: any,
    itemType: string,
    participantDesignation?: ParticipantDesignation
  ) {
    // Prepare value data (same logic as project_checklist_items)
    let valueData: any = { status: 'submitted' as const };

    switch (itemType) {
      case 'number':
        valueData.numeric_value = Number(value);
        break;
      case 'date':
        valueData.date_value = value;
        break;
      case 'single_choice_dropdown':
        if (value === 'TRUE' || value === 'FALSE') {
          valueData.boolean_value = value === 'TRUE';
        } else if (!isNaN(Number(value))) {
          valueData.numeric_value = Number(value);
        } else {
          valueData.text_value = value;
        }
        break;
      case 'multiple_choice_checkbox':
        valueData.json_value = Array.isArray(value) ? value : [value];
        break;
      default:
        valueData.text_value = String(value);
    }

    // Build query with participant scope
    const buildUpdateQuery = (baseQuery: any) => {
      const query = baseQuery
        .eq('project_id', projectId)
        .eq('item_id', itemId)
        .eq('group_index', groupIndex);
      
      if (participantDesignation) {
        return query.eq('participant_designation', participantDesignation);
      }
      return query.is('participant_designation', null);
    };

    // Update the specific record (same pattern as project_checklist_items)
    switch (targetTable) {
      case 'project_secondary_income_items':
        return await buildUpdateQuery(
          supabase
            .from('project_secondary_income_items')
            .update(valueData)
        );

      case 'project_dependent_items':
        return await buildUpdateQuery(
          supabase
            .from('project_dependent_items')
            .update(valueData)
        );

      case 'project_debt_items':
        return await buildUpdateQuery(
          supabase
            .from('project_debt_items')
            .update(valueData)
        );

      default:
        throw new Error(`Unsupported table: ${targetTable}`);
    }
  }

  // Delete a group (clean up empty groups)
  static async deleteGroup(
    projectId: string, 
    targetTable: string, 
    groupIndex: number, 
    participantDesignation?: ParticipantDesignation
  ) {
    const buildDeleteQuery = (baseQuery: any) => {
      const query = baseQuery
        .eq('project_id', projectId)
        .eq('group_index', groupIndex);
      
      if (participantDesignation) {
        return query.eq('participant_designation', participantDesignation);
      }
      return query.is('participant_designation', null);
    };
    
    switch (targetTable) {
      case 'project_secondary_income_items':
        return await buildDeleteQuery(
          supabase
            .from('project_secondary_income_items')
            .delete()
        );

      case 'project_dependent_items':
        return await buildDeleteQuery(
          supabase
            .from('project_dependent_items')
            .delete()
        );

      case 'project_debt_items':
        return await buildDeleteQuery(
          supabase
            .from('project_debt_items')
            .delete()
        );

      default:
        throw new Error(`Unsupported table: ${targetTable}`);
    }
  }

  // Check if group has any answers (for cleanup)
  static async groupHasAnswers(
    projectId: string, 
    targetTable: string, 
    groupIndex: number, 
    participantDesignation?: ParticipantDesignation
  ): Promise<boolean> {
    const buildQuery = (baseQuery: any) => {
      const query = baseQuery
        .eq('project_id', projectId)
        .eq('group_index', groupIndex)
        .or('text_value.not.is.null,numeric_value.not.is.null,boolean_value.not.is.null,date_value.not.is.null,json_value.not.is.null')
        .limit(1);
      
      if (participantDesignation) {
        return query.eq('participant_designation', participantDesignation);
      }
      return query.is('participant_designation', null);
    };
    
    let query;
    
    switch (targetTable) {
      case 'project_secondary_income_items':
        query = buildQuery(
          supabase
            .from('project_secondary_income_items')
            .select('id')
        );
        break;

      case 'project_dependent_items':
        query = buildQuery(
          supabase
            .from('project_dependent_items')
            .select('id')
        );
        break;

      case 'project_debt_items':
        query = buildQuery(
          supabase
            .from('project_debt_items')
            .select('id')
        );
        break;

      default:
        throw new Error(`Unsupported table: ${targetTable}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data && data.length > 0;
  }
}
