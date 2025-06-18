
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { ItemTransformationService } from './itemTransformationService';
import { SubcategoryTargetTableService } from './subcategoryTargetTableService';

type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type ProjectType = Database['public']['Enums']['project_type'];
type ApplicantCount = Database['public']['Enums']['applicant_count'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

export interface GenerationResult {
  itemsCreated: number;
  errors: string[];
  warnings: string[];
}

export class FormGenerationService {
  /**
   * Enhanced form generation with proper repeatable group handling
   */
  static async generateChecklistForProject(
    projectId: string,
    forceRegenerate: boolean = false
  ): Promise<GenerationResult> {
    console.log('🔧 FormGenerationService: Starting generation for project:', projectId);
    
    try {
      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        throw new Error(`Failed to fetch project: ${projectError.message}`);
      }

      // Check if checklist already exists
      if (!forceRegenerate && project.checklist_generated_at) {
        console.log('🔧 Checklist already generated, skipping...');
        return {
          itemsCreated: 0,
          errors: [],
          warnings: ['Checklist already generated. Use force regenerate to recreate.']
        };
      }

      // Get all required items
      const allItems = await ItemTransformationService.getAllRequiredItems();
      console.log('🔧 Total required items fetched:', allItems.length);

      // Filter items based on enhanced generation rules for repeatable groups
      const eligibleItems = this.filterEligibleItems(allItems, project);
      console.log('🔧 Eligible items after filtering:', eligibleItems.length);

      // Determine participant designations
      const participantDesignations = this.getParticipantDesignations(project.applicant_count);
      console.log('🔧 Participant designations:', participantDesignations);

      // Create checklist items
      const result = await this.createChecklistItems(projectId, eligibleItems, participantDesignations);

      // Update project to mark checklist as generated
      await supabase
        .from('projects')
        .update({ checklist_generated_at: new Date().toISOString() })
        .eq('id', projectId);

      console.log('🔧 FormGenerationService: Generation completed successfully');
      return result;

    } catch (error) {
      console.error('🔧 FormGenerationService: Generation failed:', error);
      throw error;
    }
  }

  /**
   * FIXED: Enhanced filtering logic that properly handles repeatable groups
   */
  private static filterEligibleItems(
    allItems: any[],
    project: any
  ): any[] {
    console.log('🔧 Filtering items with enhanced repeatable group logic...');
    
    return allItems.filter(item => {
      // Rule 1: Check project type applicability
      if (item.project_types_applicable && 
          item.project_types_applicable.length > 0 && 
          !item.project_types_applicable.includes(project.project_type)) {
        console.log(`🔧 Item ${item.item_name} excluded by project type`);
        return false;
      }

      // Rule 2: CRITICAL FIX - Include main questions AND repeatable group questions
      const isMainQuestion = !item.subcategory;
      const isRepeatableGroup = item.item_type === 'repeatable_group';
      const isInitiatorQuestion = item.subcategory_1_initiator || item.subcategory_2_initiator;

      // Include if it's a main question, a repeatable group, or an initiator
      const shouldInclude = isMainQuestion || isRepeatableGroup || isInitiatorQuestion;

      // CRITICAL: Exclude child questions of repeatable groups from checklist creation
      // Child questions should only exist as templates for target table operations
      const isChildOfRepeatableGroup = item.subcategory && !isInitiatorQuestion && !isRepeatableGroup;
      
      if (isChildOfRepeatableGroup) {
        console.log(`🔧 Item ${item.item_name} excluded as child of repeatable group (subcategory: ${item.subcategory})`);
        return false;
      }

      if (shouldInclude) {
        console.log(`🔧 Item ${item.item_name} included (main: ${isMainQuestion}, repeatable: ${isRepeatableGroup}, initiator: ${isInitiatorQuestion})`);
      } else {
        console.log(`🔧 Item ${item.item_name} excluded by inclusion rules`);
      }

      return shouldInclude;
    });
  }

  /**
   * Create checklist items with proper scope handling
   */
  private static async createChecklistItems(
    projectId: string,
    eligibleItems: any[],
    participantDesignations: ParticipantDesignation[]
  ): Promise<GenerationResult> {
    console.log('🔧 Creating checklist items...');
    
    let itemsCreated = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const item of eligibleItems) {
      try {
        if (item.scope === 'PROJECT') {
          // Single project-level item
          const { error } = await supabase
            .from('project_checklist_items')
            .insert({
              project_id: projectId,
              item_id: item.id,
              status: 'pending'
            });

          if (error) {
            if (!error.message.includes('duplicate key')) {
              errors.push(`Failed to create item ${item.item_name}: ${error.message}`);
            }
          } else {
            itemsCreated++;
            console.log(`🔧 Created PROJECT item: ${item.item_name}`);
          }

        } else if (item.scope === 'PARTICIPANT') {
          // Create one item per participant
          for (const designation of participantDesignations) {
            const { error } = await supabase
              .from('project_checklist_items')
              .insert({
                project_id: projectId,
                item_id: item.id,
                participant_designation: designation,
                status: 'pending'
              });

            if (error) {
              if (!error.message.includes('duplicate key')) {
                errors.push(`Failed to create participant item ${item.item_name} for ${designation}: ${error.message}`);
              }
            } else {
              itemsCreated++;
              console.log(`🔧 Created PARTICIPANT item: ${item.item_name} for ${designation}`);
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Exception creating item ${item.item_name}: ${errorMessage}`);
      }
    }

    return { itemsCreated, errors, warnings };
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
        return ['applicant_one', 'applicant_two'];
      default:
        return ['solo_applicant'];
    }
  }

  /**
   * Complete regeneration - clears existing checklist and recreates
   */
  static async regenerateChecklistForProject(projectId: string): Promise<GenerationResult> {
    console.log('🔧 FormGenerationService: Starting complete regeneration for project:', projectId);
    
    try {
      // Clear existing checklist items
      await supabase
        .from('project_checklist_items')
        .delete()
        .eq('project_id', projectId);

      // Reset generation timestamp
      await supabase
        .from('projects')
        .update({ checklist_generated_at: null })
        .eq('id', projectId);

      console.log('🔧 Cleared existing checklist, regenerating...');

      // Generate fresh checklist
      return await this.generateChecklistForProject(projectId, true);

    } catch (error) {
      console.error('🔧 FormGenerationService: Regeneration failed:', error);
      throw error;
    }
  }
}
