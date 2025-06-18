import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type ChecklistItem = Database['public']['Tables']['project_checklist_items']['Row'];
type ProjectType = Database['public']['Enums']['project_type'];
type ApplicantCount = Database['public']['Enums']['applicant_count'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

// Add interface for transformed required item with camelCase fields
interface TransformedRequiredItem extends Omit<RequiredItem, 'repeatable_group_title' | 'repeatable_group_subtitle' | 'repeatable_group_start_button_text' | 'repeatable_group_top_button_text' | 'repeatable_group_target_table'> {
  repeatableGroupTitle?: string;
  repeatableGroupSubtitle?: string;
  repeatableGroupStartButtonText?: string;
  repeatableGroupTopButtonText?: string;
  repeatableGroupTargetTable?: string;
}

export interface GenerationResult {
  itemsCreated: number;
  itemsSkipped: number;
  errors: string[];
  generatedItems: ChecklistItem[];
  debugInfo?: {
    totalItemsInDatabase: number;
    itemsAfterProjectTypeFilter: number;
    itemsAfterSubcategoryFilter: number;
    itemsPassedAllFilters: number;
    filteredItems: Array<{
      id: string;
      item_name: string;
      subcategory: string | null;
      subcategory_1_initiator: boolean | null;
      subcategory_2_initiator: boolean | null;
      project_types_applicable: string[] | null;
      scope: string;
      category_id: string | null;
    }>;
  };
}

export class FormGenerationService {
  /**
   * Transform snake_case database fields to camelCase for frontend compatibility
   */
  private static transformRequiredItem(item: RequiredItem): TransformedRequiredItem {
    const transformed: TransformedRequiredItem = {
      ...item,
      repeatableGroupTitle: item.repeatable_group_title || undefined,
      repeatableGroupSubtitle: item.repeatable_group_subtitle || undefined,
      repeatableGroupStartButtonText: item.repeatable_group_start_button_text || undefined,
      repeatableGroupTopButtonText: item.repeatable_group_top_button_text || undefined,
      repeatableGroupTargetTable: item.repeatable_group_target_table || undefined,
    };

    // Remove the snake_case properties to avoid confusion
    delete (transformed as any).repeatable_group_title;
    delete (transformed as any).repeatable_group_subtitle;
    delete (transformed as any).repeatable_group_start_button_text;
    delete (transformed as any).repeatable_group_top_button_text;
    delete (transformed as any).repeatable_group_target_table;

    return transformed;
  }

  /**
   * Main entry point for generating checklist items for a project
   */
  static async generateChecklistForProject(
    projectId: string,
    forceRegenerate: boolean = false
  ): Promise<GenerationResult> {
    console.log('🔧 Starting form generation for project:', projectId);
    
    try {
      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        throw new Error(`Project not found: ${projectError?.message}`);
      }

      console.log('📋 Project details:', {
        id: project.id,
        name: project.name,
        project_type: project.project_type,
        applicant_count: project.applicant_count,
        checklist_generated_at: project.checklist_generated_at
      });

      // Check if already generated (unless forcing regeneration)
      if (project.checklist_generated_at && !forceRegenerate) {
        console.log('📋 Checklist already generated for project');
        return {
          itemsCreated: 0,
          itemsSkipped: 0,
          errors: ['Checklist already generated'],
          generatedItems: []
        };
      }

      // Get all required items with enhanced debugging information
      const { data: allItems, error: itemsError } = await supabase
        .from('required_items')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (itemsError) {
        throw new Error(`Failed to fetch required items: ${itemsError.message}`);
      }

      console.log(`📝 Total items in database: ${allItems?.length || 0}`);

      // Transform items to camelCase format
      const transformedItems = (allItems || []).map(item => this.transformRequiredItem(item));

      // Apply enhanced filtering rules with detailed debugging
      const { applicableItems, debugInfo } = this.filterItemsByRulesWithDebug(transformedItems, project);
      console.log(`📝 Filtered to ${applicableItems.length} applicable items`);
      console.log('🔍 Debug info:', debugInfo);

      // Generate checklist items
      const result = await this.createChecklistItems(applicableItems, project);
      console.log(`✅ Generated ${result.itemsCreated} checklist items`);

      // Add debug info to result
      result.debugInfo = {
        totalItemsInDatabase: allItems?.length || 0,
        ...debugInfo
      };

      // Update project to mark as generated
      await supabase
        .from('projects')
        .update({ checklist_generated_at: new Date().toISOString() })
        .eq('id', projectId);

      return result;
    } catch (error) {
      console.error('❌ Form generation failed:', error);
      return {
        itemsCreated: 0,
        itemsSkipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        generatedItems: []
      };
    }
  }

  /**
   * Apply filtering rules with comprehensive debugging - FIXED VERSION
   */
  private static filterItemsByRulesWithDebug(items: TransformedRequiredItem[], project: Project): {
    applicableItems: TransformedRequiredItem[];
    debugInfo: {
      itemsAfterProjectTypeFilter: number;
      itemsAfterSubcategoryFilter: number;
      itemsPassedAllFilters: number;
      filteredItems: Array<{
        id: string;
        item_name: string;
        subcategory: string | null;
        subcategory_1_initiator: boolean | null;
        subcategory_2_initiator: boolean | null;
        project_types_applicable: string[] | null;
        scope: string;
        category_id: string | null;
      }>;
    };
  } {
    console.log('\n🔍 === FILTERING DEBUG SESSION (FIXED) ===');
    
    let itemsAfterProjectTypeFilter = 0;
    let itemsAfterSubcategoryFilter = 0;
    
    const applicableItems = items.filter(item => {
      console.log(`\n📋 Evaluating item: "${item.item_name}"`);
      console.log(`   - ID: ${item.id}`);
      console.log(`   - Category: ${item.category_id}`);
      console.log(`   - Scope: ${item.scope}`);
      console.log(`   - Subcategory: ${item.subcategory === null ? 'NULL (main question)' : `"${item.subcategory}"`}`);
      console.log(`   - Subcategory 1 Initiator: ${item.subcategory_1_initiator}`);
      console.log(`   - Subcategory 2 Initiator: ${item.subcategory_2_initiator}`);
      console.log(`   - Project Types Applicable: ${JSON.stringify(item.project_types_applicable)}`);
      console.log(`   - Repeatable Group Target Table: ${item.repeatableGroupTargetTable || 'N/A'}`);

      // Rule 1: Check project_types_applicable
      if (item.project_types_applicable && 
          item.project_types_applicable.length > 0 && 
          project.project_type) {
        const isApplicable = item.project_types_applicable.includes(project.project_type);
        if (!isApplicable) {
          console.log(`   ❌ FILTERED OUT: project type ${project.project_type} not in applicable types`);
          return false;
        }
        console.log(`   ✅ PASSED: project type filter`);
      } else {
        console.log(`   ✅ PASSED: no project type restriction or project type is null`);
      }
      itemsAfterProjectTypeFilter++;

      // Rule 2: FIXED subcategory logic - Only include main questions (NULL subcategory) and initiator questions
      const isMainQuestion = item.subcategory === null;
      const isInitiatorQuestion = item.subcategory_1_initiator === true || item.subcategory_2_initiator === true;
      
      if (!isMainQuestion && !isInitiatorQuestion) {
        console.log(`   ❌ FILTERED OUT: conditional question (has subcategory '${item.subcategory}' but is not an initiator)`);
        return false;
      }
      
      if (isMainQuestion) {
        console.log(`   ✅ PASSED: main question (subcategory is NULL)`);
      } else {
        console.log(`   ✅ PASSED: initiator question for subcategory '${item.subcategory}'`);
      }
      itemsAfterSubcategoryFilter++;

      console.log(`   🎯 FINAL RESULT: INCLUDED`);
      return true;
    });

    const debugInfo = {
      itemsAfterProjectTypeFilter,
      itemsAfterSubcategoryFilter,
      itemsPassedAllFilters: applicableItems.length,
      filteredItems: applicableItems.map(item => ({
        id: item.id,
        item_name: item.item_name,
        subcategory: item.subcategory,
        subcategory_1_initiator: item.subcategory_1_initiator,
        subcategory_2_initiator: item.subcategory_2_initiator,
        project_types_applicable: item.project_types_applicable,
        scope: item.scope,
        category_id: item.category_id
      }))
    };

    console.log('\n📊 === FILTERING SUMMARY (FIXED) ===');
    console.log(`Total items: ${items.length}`);
    console.log(`After project type filter: ${itemsAfterProjectTypeFilter}`);
    console.log(`After subcategory filter: ${itemsAfterSubcategoryFilter}`);
    console.log(`Final applicable items: ${applicableItems.length}`);
    console.log('=== END DEBUG SESSION ===\n');

    return { applicableItems, debugInfo };
  }

  /**
   * Apply the core filtering rules (simplified version for legacy compatibility)
   */
  private static filterItemsByRules(items: TransformedRequiredItem[], project: Project): TransformedRequiredItem[] {
    const { applicableItems } = this.filterItemsByRulesWithDebug(items, project);
    return applicableItems;
  }

  /**
   * Create checklist items with proper participant designations
   */
  private static async createChecklistItems(
    items: TransformedRequiredItem[],
    project: Project
  ): Promise<GenerationResult> {
    const result: GenerationResult = {
      itemsCreated: 0,
      itemsSkipped: 0,
      errors: [],
      generatedItems: []
    };

    for (const item of items) {
      try {
        if (item.scope === 'PROJECT') {
          // Rule 2a: PROJECT scope - create one item without participant designation
          const checklistItem = await this.createSingleChecklistItem(
            project.id,
            item.id,
            undefined
          );
          if (checklistItem) {
            result.generatedItems.push(checklistItem);
            result.itemsCreated++;
            console.log(`Created PROJECT item: ${item.item_name}`);
          }
        } else if (item.scope === 'PARTICIPANT') {
          // Rule 2b: PARTICIPANT scope - create items based on applicant count
          const participantDesignations = this.getParticipantDesignations(
            project.applicant_count || 'one_applicant'
          );

          for (const designation of participantDesignations) {
            const checklistItem = await this.createSingleChecklistItem(
              project.id,
              item.id,
              designation
            );
            if (checklistItem) {
              result.generatedItems.push(checklistItem);
              result.itemsCreated++;
              console.log(`Created PARTICIPANT item: ${item.item_name} for ${designation}`);
            }
          }
        }
      } catch (error) {
        const errorMsg = `Failed to create item ${item.item_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        result.itemsSkipped++;
        console.error(errorMsg);
      }
    }

    return result;
  }

  /**
   * Create a single checklist item
   */
  private static async createSingleChecklistItem(
    projectId: string,
    itemId: string,
    participantDesignation?: ParticipantDesignation
  ): Promise<ChecklistItem | null> {
    const { data, error } = await supabase
      .from('project_checklist_items')
      .insert({
        project_id: projectId,
        item_id: itemId,
        participant_designation: participantDesignation,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violations gracefully
      if (error.code === '23505') {
        console.log(`Checklist item already exists for ${itemId}/${participantDesignation || 'PROJECT'}`);
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Get participant designations based on applicant count
   */
  private static getParticipantDesignations(applicantCount: ApplicantCount): ParticipantDesignation[] {
    switch (applicantCount) {
      case 'one_applicant':
        return ['solo_applicant'];
      case 'two_applicants':
        return ['applicant_one', 'applicant_two'];
      case 'three_or_more_applicants':
        // For now, treating this the same as two_applicants
        return ['applicant_one', 'applicant_two'];
      default:
        return ['solo_applicant'];
    }
  }

  /**
   * Manually trigger form generation for a project (regenerate)
   */
  static async regenerateChecklistForProject(projectId: string): Promise<GenerationResult> {
    console.log('🔄 Regenerating checklist for project:', projectId);
    
    // Clear existing checklist items
    const { error: deleteError } = await supabase
      .from('project_checklist_items')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) {
      throw new Error(`Failed to clear existing items: ${deleteError.message}`);
    }

    // Reset generation timestamp
    await supabase
      .from('projects')
      .update({ checklist_generated_at: null })
      .eq('id', projectId);

    // Generate new checklist
    return this.generateChecklistForProject(projectId, true);
  }

  /**
   * Get generation status for a project
   */
  static async getGenerationStatus(projectId: string): Promise<{
    isGenerated: boolean;
    generatedAt: string | null;
    itemCount: number;
  }> {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('checklist_generated_at')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw new Error(`Failed to get project: ${projectError.message}`);
    }

    const { count, error: countError } = await supabase
      .from('project_checklist_items')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (countError) {
      throw new Error(`Failed to count items: ${countError.message}`);
    }

    return {
      isGenerated: !!project.checklist_generated_at,
      generatedAt: project.checklist_generated_at,
      itemCount: count || 0
    };
  }
}
