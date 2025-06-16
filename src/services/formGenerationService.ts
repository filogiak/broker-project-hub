import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type ChecklistItem = Database['public']['Tables']['project_checklist_items']['Row'];
type ProjectType = Database['public']['Enums']['project_type'];
type ApplicantCount = Database['public']['Enums']['applicant_count'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

export interface GenerationResult {
  itemsCreated: number;
  itemsSkipped: number;
  errors: string[];
  generatedItems: ChecklistItem[];
}

export class FormGenerationService {
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

      // Get all required items with enhanced subcategory information
      const { data: allItems, error: itemsError } = await supabase
        .from('required_items')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (itemsError) {
        throw new Error(`Failed to fetch required items: ${itemsError.message}`);
      }

      // Apply enhanced filtering rules including subcategory logic
      const applicableItems = this.filterItemsByRules(allItems || [], project);
      console.log(`📝 Filtered to ${applicableItems.length} applicable items (main + initiator questions only)`);

      // Generate checklist items
      const result = await this.createChecklistItems(applicableItems, project);
      console.log(`✅ Generated ${result.itemsCreated} checklist items`);

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
   * Apply the three core filtering rules including subcategory logic
   */
  private static filterItemsByRules(items: RequiredItem[], project: Project): RequiredItem[] {
    return items.filter(item => {
      // Rule 1: Check project_types_applicable
      if (item.project_types_applicable && 
          item.project_types_applicable.length > 0 && 
          project.project_type) {
        const isApplicable = item.project_types_applicable.includes(project.project_type);
        if (!isApplicable) {
          console.log(`Skipping item ${item.item_name}: project type ${project.project_type} not in applicable types`);
          return false;
        }
      }

      // Rule 3: Only include main questions and initiator questions
      const isMainQuestion = !item.subcategory;
      const isInitiatorQuestion = item.subcategory_1_initiator === true || item.subcategory_2_initiator === true;
      
      if (!isMainQuestion && !isInitiatorQuestion) {
        console.log(`Skipping conditional item ${item.item_name}: has subcategory '${item.subcategory}' but is not an initiator`);
        return false;
      }

      console.log(`Including item ${item.item_name}: ${isMainQuestion ? 'main question' : 'initiator question'}`);
      return true;
    });
  }

  /**
   * Create checklist items with proper participant designations
   */
  private static async createChecklistItems(
    items: RequiredItem[],
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
