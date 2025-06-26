
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

export interface CategoryCompletionInfo {
  categoryId: string;
  categoryName: string;
  completedItems: number;
  totalItems: number;
  completionPercentage: number;
  isComplete: boolean;
}

export class CategoryCompletionService {
  /**
   * Calculate completion percentage for a specific category
   */
  static async getCategoryCompletion(
    projectId: string,
    categoryId: string,
    participantDesignation?: ParticipantDesignation
  ): Promise<CategoryCompletionInfo> {
    try {
      // Get all required items for this category
      const { data: requiredItems, error: requiredError } = await supabase
        .from('required_items')
        .select('id, item_name, scope')
        .eq('category_id', categoryId);

      if (requiredError) throw requiredError;

      const totalItems = requiredItems?.length || 0;
      
      if (totalItems === 0) {
        return {
          categoryId,
          categoryName: '',
          completedItems: 0,
          totalItems: 0,
          completionPercentage: 100,
          isComplete: true
        };
      }

      // Get completed items from various tables based on scope
      let completedCount = 0;
      
      for (const item of requiredItems || []) {
        const isCompleted = await this.checkItemCompletion(
          projectId,
          item.id,
          item.scope,
          participantDesignation
        );
        if (isCompleted) completedCount++;
      }

      const completionPercentage = Math.round((completedCount / totalItems) * 100);

      return {
        categoryId,
        categoryName: '',
        completedItems: completedCount,
        totalItems,
        completionPercentage,
        isComplete: completionPercentage === 100
      };
    } catch (error) {
      console.error('Error calculating category completion:', error);
      return {
        categoryId,
        categoryName: '',
        completedItems: 0,
        totalItems: 0,
        completionPercentage: 0,
        isComplete: false
      };
    }
  }

  /**
   * Check if a specific item is completed
   */
  private static async checkItemCompletion(
    projectId: string,
    itemId: string,
    scope: string,
    participantDesignation?: ParticipantDesignation
  ): Promise<boolean> {
    try {
      // Check in project_checklist_items table
      let query = supabase
        .from('project_checklist_items')
        .select('id')
        .eq('project_id', projectId)
        .eq('item_id', itemId)
        .in('status', ['submitted', 'approved']);

      if (scope === 'PARTICIPANT' && participantDesignation) {
        query = query.eq('participant_designation', participantDesignation);
      }

      const { data: checklistData } = await query.limit(1);
      
      if (checklistData && checklistData.length > 0) {
        return true;
      }

      // Check in project_documents table
      const { data: documentData } = await supabase
        .from('project_documents')
        .select('id')
        .eq('project_id', projectId)
        .eq('item_id', itemId)
        .limit(1);

      return documentData && documentData.length > 0;
    } catch (error) {
      console.error('Error checking item completion:', error);
      return false;
    }
  }

  /**
   * Get completion info for all categories in a project
   */
  static async getAllCategoriesCompletion(
    projectId: string,
    categories: Array<{ id: string; name: string }>,
    participantDesignation?: ParticipantDesignation
  ): Promise<CategoryCompletionInfo[]> {
    const completionPromises = categories.map(async (category) => {
      const completion = await this.getCategoryCompletion(
        projectId,
        category.id,
        participantDesignation
      );
      return {
        ...completion,
        categoryName: category.name
      };
    });

    return Promise.all(completionPromises);
  }
}
