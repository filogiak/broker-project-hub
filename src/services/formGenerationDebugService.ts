
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

interface ProjectDebugInfo {
  project: {
    id: string;
    name: string;
    project_type: string | null;
    applicant_count: string;
    checklist_generated_at: string | null;
  };
  requiredItemsStats: {
    total: number;
    mainQuestions: number;
    initiatorQuestions: number;
    conditionalQuestions: number;
    byCategory: Array<{
      categoryId: string;
      categoryName: string;
      mainQuestions: number;
      initiatorQuestions: number;
      conditionalQuestions: number;
    }>;
  };
  checklistItemsStats: {
    total: number;
    byCategory: Array<{
      categoryId: string;
      categoryName: string;
      count: number;
    }>;
    problemItems: Array<{
      id: string;
      itemName: string;
      subcategory: string | null;
      isInitiator: boolean;
      shouldBeIncluded: boolean;
    }>;
  };
}

export class FormGenerationDebugService {
  /**
   * Get comprehensive debug information for a project
   */
  static async getProjectDebugInfo(projectId: string): Promise<ProjectDebugInfo> {
    // Get project details
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, project_type, applicant_count, checklist_generated_at')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new Error('Project not found');
    }

    // Get all required items with category information
    const { data: requiredItems } = await supabase
      .from('required_items')
      .select(`
        *,
        items_categories (
          id,
          name
        )
      `);

    // Get all checklist items for this project
    const { data: checklistItems } = await supabase
      .from('project_checklist_items')
      .select(`
        *,
        required_items (
          item_name,
          subcategory,
          subcategory_1_initiator,
          subcategory_2_initiator,
          category_id,
          items_categories (
            name
          )
        )
      `)
      .eq('project_id', projectId);

    // Analyze required items
    const requiredItemsStats = this.analyzeRequiredItems(requiredItems || []);
    
    // Analyze checklist items
    const checklistItemsStats = this.analyzeChecklistItems(checklistItems || [], requiredItems || []);

    return {
      project: {
        id: project.id,
        name: project.name,
        project_type: project.project_type,
        applicant_count: project.applicant_count,
        checklist_generated_at: project.checklist_generated_at,
      },
      requiredItemsStats,
      checklistItemsStats,
    };
  }

  /**
   * Analyze required items statistics
   */
  private static analyzeRequiredItems(items: any[]) {
    const stats = {
      total: items.length,
      mainQuestions: 0,
      initiatorQuestions: 0,
      conditionalQuestions: 0,
      byCategory: new Map<string, { categoryId: string; categoryName: string; mainQuestions: number; initiatorQuestions: number; conditionalQuestions: number; }>(),
    };

    items.forEach(item => {
      const isMainQuestion = !item.subcategory;
      const isInitiatorQuestion = item.subcategory_1_initiator === true || item.subcategory_2_initiator === true;
      const isConditionalQuestion = !!item.subcategory && !isInitiatorQuestion;

      if (isMainQuestion) {
        stats.mainQuestions++;
      } else if (isInitiatorQuestion) {
        stats.initiatorQuestions++;
      } else if (isConditionalQuestion) {
        stats.conditionalQuestions++;
      }

      // By category stats
      const categoryId = item.category_id || 'uncategorized';
      const categoryName = item.items_categories?.name || 'Uncategorized';
      
      if (!stats.byCategory.has(categoryId)) {
        stats.byCategory.set(categoryId, {
          categoryId,
          categoryName,
          mainQuestions: 0,
          initiatorQuestions: 0,
          conditionalQuestions: 0,
        });
      }

      const categoryStats = stats.byCategory.get(categoryId)!;
      if (isMainQuestion) {
        categoryStats.mainQuestions++;
      } else if (isInitiatorQuestion) {
        categoryStats.initiatorQuestions++;
      } else if (isConditionalQuestion) {
        categoryStats.conditionalQuestions++;
      }
    });

    return {
      ...stats,
      byCategory: Array.from(stats.byCategory.values()),
    };
  }

  /**
   * Analyze checklist items and identify problems
   */
  private static analyzeChecklistItems(checklistItems: any[], requiredItems: any[]) {
    const stats = {
      total: checklistItems.length,
      byCategory: new Map<string, { categoryId: string; categoryName: string; count: number; }>(),
      problemItems: [] as Array<{
        id: string;
        itemName: string;
        subcategory: string | null;
        isInitiator: boolean;
        shouldBeIncluded: boolean;
      }>,
    };

    // Create a lookup for required items
    const requiredItemsLookup = new Map(requiredItems.map(item => [item.id, item]));

    checklistItems.forEach(checklistItem => {
      const requiredItem = checklistItem.required_items;
      if (!requiredItem) return;

      const categoryId = requiredItem.category_id || 'uncategorized';
      const categoryName = requiredItem.items_categories?.name || 'Uncategorized';

      // By category stats
      if (!stats.byCategory.has(categoryId)) {
        stats.byCategory.set(categoryId, { categoryId, categoryName, count: 0 });
      }
      stats.byCategory.get(categoryId)!.count++;

      // Check if this item should have been included
      const isMainQuestion = !requiredItem.subcategory;
      const isInitiatorQuestion = requiredItem.subcategory_1_initiator === true || requiredItem.subcategory_2_initiator === true;
      const isConditionalQuestion = !!requiredItem.subcategory && !isInitiatorQuestion;
      const shouldBeIncluded = isMainQuestion || isInitiatorQuestion;

      // Identify problem items (conditional questions that shouldn't be in initial generation)
      if (isConditionalQuestion) {
        stats.problemItems.push({
          id: checklistItem.id,
          itemName: requiredItem.item_name,
          subcategory: requiredItem.subcategory,
          isInitiator: isInitiatorQuestion,
          shouldBeIncluded,
        });
      }
    });

    return {
      ...stats,
      byCategory: Array.from(stats.byCategory.values()),
    };
  }

  /**
   * Clean up incorrectly added conditional questions
   */
  static async cleanupConditionalQuestions(projectId: string): Promise<{
    deletedCount: number;
    deletedItems: string[];
  }> {
    console.log('🧹 Starting cleanup of conditional questions for project:', projectId);

    // Get all checklist items that are conditional questions (not initiators)
    const { data: problematicItems } = await supabase
      .from('project_checklist_items')
      .select(`
        id,
        required_items (
          item_name,
          subcategory,
          subcategory_1_initiator,
          subcategory_2_initiator
        )
      `)
      .eq('project_id', projectId);

    if (!problematicItems) {
      return { deletedCount: 0, deletedItems: [] };
    }

    // Filter to only conditional questions that shouldn't be there
    const itemsToDelete = problematicItems.filter(item => {
      const requiredItem = item.required_items;
      if (!requiredItem) return false;
      
      const hasSubcategory = !!requiredItem.subcategory;
      const isInitiator = requiredItem.subcategory_1_initiator === true || requiredItem.subcategory_2_initiator === true;
      
      // Delete if it has a subcategory but is not an initiator
      return hasSubcategory && !isInitiator;
    });

    console.log(`🧹 Found ${itemsToDelete.length} conditional questions to delete`);

    if (itemsToDelete.length === 0) {
      return { deletedCount: 0, deletedItems: [] };
    }

    // Delete the problematic items
    const idsToDelete = itemsToDelete.map(item => item.id);
    const deletedItemNames = itemsToDelete.map(item => item.required_items?.item_name || 'Unknown');

    const { error } = await supabase
      .from('project_checklist_items')
      .delete()
      .in('id', idsToDelete);

    if (error) {
      throw new Error(`Failed to delete conditional questions: ${error.message}`);
    }

    console.log(`🧹 Successfully deleted ${itemsToDelete.length} conditional questions`);
    
    return {
      deletedCount: itemsToDelete.length,
      deletedItems: deletedItemNames,
    };
  }

  /**
   * Log comprehensive debug information
   */
  static async logDebugInfo(projectId: string): Promise<void> {
    const debugInfo = await this.getProjectDebugInfo(projectId);
    
    console.log('\n🔍 === PROJECT DEBUG REPORT ===');
    console.log('Project:', debugInfo.project);
    console.log('\nRequired Items Stats:', debugInfo.requiredItemsStats);
    console.log('\nChecklist Items Stats:', debugInfo.checklistItemsStats);
    
    if (debugInfo.checklistItemsStats.problemItems.length > 0) {
      console.log('\n⚠️ PROBLEM ITEMS FOUND:');
      debugInfo.checklistItemsStats.problemItems.forEach(item => {
        console.log(`  - ${item.itemName} (${item.subcategory}) - Should be included: ${item.shouldBeIncluded}`);
      });
    }
    
    console.log('=== END DEBUG REPORT ===\n');
  }
}
