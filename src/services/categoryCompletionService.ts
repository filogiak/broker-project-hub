
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
      
      // Single optimized query to get all completion data
      const completionQuery = `
        WITH completion_data AS (
          SELECT 
            ri.category_id,
            ri.id as item_id,
            CASE 
              WHEN (pci.id IS NOT NULL AND pci.status IN ('submitted', 'approved')) 
                OR pd.id IS NOT NULL 
              THEN 1 
              ELSE 0 
            END as is_completed
          FROM required_items ri
          LEFT JOIN project_checklist_items pci ON ri.id = pci.item_id 
            AND pci.project_id = $1
            ${participantDesignation ? 'AND pci.participant_designation = $3' : ''}
          LEFT JOIN project_documents pd ON ri.id = pd.item_id 
            AND pd.project_id = $1
            ${participantDesignation ? 'AND pd.participant_designation = $3' : ''}
          WHERE ri.category_id = ANY($2)
        )
        SELECT 
          category_id,
          COUNT(*) as total_items,
          SUM(is_completed) as completed_items
        FROM completion_data
        GROUP BY category_id
      `;

      const queryParams = participantDesignation 
        ? [projectId, categoryIds, participantDesignation]
        : [projectId, categoryIds];

      const { data: completionData, error } = await supabase.rpc('exec_sql', {
        query: completionQuery,
        params: queryParams
      });

      if (error) {
        console.error('Error fetching completion data:', error);
        // Fallback to individual queries if the optimized query fails
        return this.getFallbackCompletion(projectId, categories, participantDesignation);
      }

      // Transform the results into CategoryCompletionInfo
      const completionMap = new Map(
        completionData?.map((row: any) => [
          row.category_id,
          {
            totalItems: parseInt(row.total_items),
            completedItems: parseInt(row.completed_items)
          }
        ]) || []
      );

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
