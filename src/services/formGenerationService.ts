
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type ChecklistItem = Database['public']['Tables']['project_checklist_items']['Row'];
type FormGenerationRule = Database['public']['Tables']['form_generation_rules']['Row'];
type ProjectType = Database['public']['Enums']['project_type'];
type ApplicantCount = Database['public']['Enums']['applicant_count'];
type ParticipantDesignation = Database['public']['Enums']['participant_designation'];
type ItemScope = Database['public']['Enums']['item_scope'];

export interface GenerationContext {
  projectId: string;
  projectType?: ProjectType | null;
  applicantCount: ApplicantCount;
  hasGuarantor: boolean;
  existingAnswers?: Record<string, any>;
}

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

      // Create generation context
      const context: GenerationContext = {
        projectId: project.id,
        projectType: project.project_type,
        applicantCount: project.applicant_count || 'one_applicant',
        hasGuarantor: project.has_guarantor || false,
      };

      // Phase 1: Base question selection
      const baseItems = await this.selectBaseItems(context);
      console.log(`📝 Selected ${baseItems.length} base items`);

      // Phase 2: Apply conditional rules
      const conditionalItems = await this.applyConditionalRules(baseItems, context);
      console.log(`⚡ Applied conditional rules, now ${conditionalItems.length} items`);

      // Phase 3: Generate checklist items with proper participant designation
      const result = await this.instantiateChecklistItems(conditionalItems, context);
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
   * Phase 1: Select base items that apply to the project
   */
  private static async selectBaseItems(context: GenerationContext): Promise<RequiredItem[]> {
    let query = supabase
      .from('required_items')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true });

    const { data: allItems, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch required items: ${error.message}`);
    }

    // Filter items based on project criteria
    const applicableItems = allItems?.filter(item => {
      // Check if item applies to this project type
      if (item.project_types_applicable && 
          item.project_types_applicable.length > 0 && 
          context.projectType &&
          !item.project_types_applicable.includes(context.projectType)) {
        return false;
      }

      return true;
    }) || [];

    return applicableItems;
  }

  /**
   * Phase 2: Apply conditional rules to modify the item list
   */
  private static async applyConditionalRules(
    baseItems: RequiredItem[],
    context: GenerationContext
  ): Promise<RequiredItem[]> {
    // Get active conditional rules
    const { data: rules, error } = await supabase
      .from('form_generation_rules')
      .select('*')
      .eq('is_active', true)
      .eq('rule_type', 'conditional')
      .order('priority', { ascending: true });

    if (error) {
      console.warn('Could not fetch conditional rules:', error.message);
      return baseItems;
    }

    let resultItems = [...baseItems];

    // Apply each rule
    for (const rule of rules || []) {
      resultItems = await this.applyConditionalRule(rule, resultItems, context);
    }

    return resultItems;
  }

  /**
   * Apply a single conditional rule
   */
  private static async applyConditionalRule(
    rule: FormGenerationRule,
    items: RequiredItem[],
    context: GenerationContext
  ): Promise<RequiredItem[]> {
    try {
      const conditionLogic = rule.condition_logic as any;
      const targetCriteria = rule.target_criteria as any;

      // Evaluate condition based on project context
      const conditionMet = this.evaluateCondition(conditionLogic, context);

      if (!conditionMet) {
        return items;
      }

      // Apply the rule based on target criteria
      if (targetCriteria.action === 'add_items') {
        // Add additional items based on criteria
        const additionalItems = await this.getAdditionalItems(targetCriteria);
        return [...items, ...additionalItems];
      } else if (targetCriteria.action === 'remove_items') {
        // Remove items based on criteria
        return items.filter(item => !this.itemMatchesCriteria(item, targetCriteria));
      }

      return items;
    } catch (error) {
      console.warn(`Failed to apply rule ${rule.rule_name}:`, error);
      return items;
    }
  }

  /**
   * Phase 3: Create actual checklist items with proper participant designations
   */
  private static async instantiateChecklistItems(
    items: RequiredItem[],
    context: GenerationContext
  ): Promise<GenerationResult> {
    const result: GenerationResult = {
      itemsCreated: 0,
      itemsSkipped: 0,
      errors: [],
      generatedItems: []
    };

    // Determine participant designations
    const participantDesignations = this.getParticipantDesignations(context.applicantCount);

    // Create checklist items for each required item
    for (const item of items) {
      try {
        if (item.scope === 'PROJECT') {
          // Single project-level item
          const checklistItem = await this.createChecklistItem(
            context.projectId,
            item.id,
            undefined // no participant designation for project-level items
          );
          if (checklistItem) {
            result.generatedItems.push(checklistItem);
            result.itemsCreated++;
          }
        } else if (item.scope === 'PARTICIPANT') {
          // Create one item per participant
          for (const designation of participantDesignations) {
            const checklistItem = await this.createChecklistItem(
              context.projectId,
              item.id,
              designation
            );
            if (checklistItem) {
              result.generatedItems.push(checklistItem);
              result.itemsCreated++;
            }
          }
        }
      } catch (error) {
        const errorMsg = `Failed to create item ${item.item_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        result.itemsSkipped++;
      }
    }

    return result;
  }

  /**
   * Create a single checklist item
   */
  private static async createChecklistItem(
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
        console.log(`Checklist item already exists for ${itemId}/${participantDesignation}`);
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
        return ['applicant_one', 'applicant_two']; // Can be extended later
      default:
        return ['solo_applicant'];
    }
  }

  /**
   * Evaluate a condition against the project context
   */
  private static evaluateCondition(conditionLogic: any, context: GenerationContext): boolean {
    try {
      // Simple condition evaluation - can be extended
      if (conditionLogic.project_type && context.projectType) {
        return conditionLogic.project_type === context.projectType;
      }
      
      if (conditionLogic.applicant_count) {
        return conditionLogic.applicant_count === context.applicantCount;
      }
      
      if (conditionLogic.has_guarantor !== undefined) {
        return conditionLogic.has_guarantor === context.hasGuarantor;
      }

      return true; // Default to true if no specific conditions
    } catch (error) {
      console.warn('Condition evaluation failed:', error);
      return false;
    }
  }

  /**
   * Get additional items based on criteria
   */
  private static async getAdditionalItems(targetCriteria: any): Promise<RequiredItem[]> {
    // Implementation for fetching additional items based on criteria
    // This would query the required_items table with specific filters
    return [];
  }

  /**
   * Check if an item matches the given criteria
   */
  private static itemMatchesCriteria(item: RequiredItem, criteria: any): boolean {
    // Implementation for checking if an item matches removal criteria
    if (criteria.item_categories && item.category_id) {
      return criteria.item_categories.includes(item.category_id);
    }
    
    if (criteria.item_types && item.item_type) {
      return criteria.item_types.includes(item.item_type);
    }

    return false;
  }

  /**
   * Manually trigger form generation for a project
   */
  static async regenerateChecklistForProject(projectId: string): Promise<GenerationResult> {
    console.log('🔄 Regenerating checklist for project:', projectId);
    
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

    // Generate new checklist
    return this.generateChecklistForProject(projectId, true);
  }
}
