
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

interface CategoryCompletionRow {
  category_id: string;
  total_items: number;
  completed_items: number;
}

export class CategoryCompletionService {
  /**
   * Get completion info for all categories in a single optimized query
   */
  static async getAllCategoriesCompletion(
    projectId: string,
    categories: Array<{ id: string; name: string }>,
    participantDesignation?: ParticipantDesignation
  ): Promise<CategoryCompletionInfo[]> {
    try {
      if (!categories.length) {
        return [];
      }

      const categoryIds = categories.map(cat => cat.id);
      
      console.log('🔄 Fetching completion data with new optimized RPC function');
      
      // Use the new RPC function for batch completion data
      const { data: completionData, error } = await supabase.rpc(
        'get_categories_completion_batch',
        {
          p_project_id: projectId,
          p_category_ids: categoryIds,
          p_participant_designation: participantDesignation || null
        }
      );

      if (error) {
        console.error('Error fetching completion data with RPC:', error);
        // Fallback to individual queries if the optimized query fails
        return this.getFallbackCompletion(projectId, categories, participantDesignation);
      }

      // Transform the results into CategoryCompletionInfo
      const completionMap = new Map<string, { totalItems: number; completedItems: number }>();
      
      if (completionData && Array.isArray(completionData)) {
        completionData.forEach((row: CategoryCompletionRow) => {
          completionMap.set(row.category_id, {
            totalItems: Number(row.total_items) || 0,
            completedItems: Number(row.completed_items) || 0
          });
        });
      }

      return categories.map(category => {
        const completion = completionMap.get(category.id);
        const totalItems = completion?.totalItems || 0;
        const completedItems = completion?.completedItems || 0;
        const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;

        return {
          categoryId: category.id,
          categoryName: category.name,
          completedItems,
          totalItems,
          completionPercentage,
          isComplete: completionPercentage === 100
        };
      });

    } catch (error) {
      console.error('Error in getAllCategoriesCompletion:', error);
      // Fallback to individual queries
      return this.getFallbackCompletion(projectId, categories, participantDesignation);
    }
  }

  /**
   * Fallback method using the original approach if the optimized query fails
   */
  private static async getFallbackCompletion(
    projectId: string,
    categories: Array<{ id: string; name: string }>,
    participantDesignation?: ParticipantDesignation
  ): Promise<CategoryCompletionInfo[]> {
    console.log('🔄 Using fallback completion method');
    
    const completionPromises = categories.map(async (category) => {
      // Get all required items for this category
      const { data: requiredItems, error: requiredError } = await supabase
        .from('required_items')
        .select('id, item_name, scope')
        .eq('category_id', category.id);

      if (requiredError) {
        console.error('Error fetching required items:', requiredError);
        return {
          categoryId: category.id,
          categoryName: category.name,
          completedItems: 0,
          totalItems: 0,
          completionPercentage: 100,
          isComplete: true
        };
      }

      const totalItems = requiredItems?.length || 0;
      
      if (totalItems === 0) {
        return {
          categoryId: category.id,
          categoryName: category.name,
          completedItems: 0,
          totalItems: 0,
          completionPercentage: 100,
          isComplete: true
        };
      }

      // Check completion status for all items in parallel
      const completionChecks = requiredItems.map(item => 
        this.checkItemCompletion(projectId, item.id, item.scope, participantDesignation)
      );

      const completionResults = await Promise.all(completionChecks);
      const completedCount = completionResults.filter(Boolean).length;
      const completionPercentage = Math.round((completedCount / totalItems) * 100);

      return {
        categoryId: category.id,
        categoryName: category.name,
        completedItems: completedCount,
        totalItems,
        completionPercentage,
        isComplete: completionPercentage === 100
      };
    });

    return Promise.all(completionPromises);
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
      let checklistQuery = supabase
        .from('project_checklist_items')
        .select('id')
        .eq('project_id', projectId)
        .eq('item_id', itemId)
        .in('status', ['submitted', 'approved']);

      if (scope === 'PARTICIPANT' && participantDesignation) {
        checklistQuery = checklistQuery.eq('participant_designation', participantDesignation);
      }

      const { data: checklistData } = await checklistQuery.limit(1);
      
      if (checklistData && checklistData.length > 0) {
        return true;
      }

      // Check in project_documents table
      let documentQuery = supabase
        .from('project_documents')
        .select('id')
        .eq('project_id', projectId)
        .eq('item_id', itemId);

      if (scope === 'PARTICIPANT' && participantDesignation) {
        documentQuery = documentQuery.eq('participant_designation', participantDesignation);
      }

      const { data: documentData } = await documentQuery.limit(1);

      return documentData && documentData.length > 0;
    } catch (error) {
      console.error('Error checking item completion:', error);
      return false;
    }
  }

  /**
   * Calculate completion percentage for a specific category (legacy method)
   */
  static async getCategoryCompletion(
    projectId: string,
    categoryId: string,
    participantDesignation?: ParticipantDesignation
  ): Promise<CategoryCompletionInfo> {
    const categories = [{ id: categoryId, name: '' }];
    const results = await this.getAllCategoriesCompletion(projectId, categories, participantDesignation);
    return results[0] || {
      categoryId,
      categoryName: '',
      completedItems: 0,
      totalItems: 0,
      completionPercentage: 0,
      isComplete: false
    };
  }
}
