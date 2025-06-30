
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

export const populateApplicantNamesInChecklist = async (projectId: string): Promise<void> => {
  console.log('🔧 Populating applicant names for project:', projectId);
  
  try {
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('❌ Failed to fetch project:', projectError);
      return;
    }

    // Find Nome and Cognome items that need to be populated
    const { data: checklistItems, error: checklistError } = await supabase
      .from('project_checklist_items')
      .select(`
        id,
        participant_designation,
        text_value,
        required_items!inner (
          id,
          item_name,
          scope
        )
      `)
      .eq('project_id', projectId)
      .in('required_items.item_name', ['Nome', 'Cognome'])
      .eq('required_items.scope', 'PARTICIPANT')
      .is('text_value', null);

    if (checklistError) {
      console.error('❌ Failed to fetch checklist items:', checklistError);
      return;
    }

    if (!checklistItems || checklistItems.length === 0) {
      console.log('✅ No empty Nome/Cognome items found to populate');
      return;
    }

    // Prepare updates
    const updates = [];

    for (const item of checklistItems) {
      let nameValue = '';
      
      // Determine which name to use based on participant designation and item type
      if (item.participant_designation === 'applicant_one') {
        if (item.required_items.item_name === 'Nome') {
          nameValue = project.applicant_one_first_name || '';
        } else if (item.required_items.item_name === 'Cognome') {
          nameValue = project.applicant_one_last_name || '';
        }
      } else if (item.participant_designation === 'applicant_two') {
        if (item.required_items.item_name === 'Nome') {
          nameValue = project.applicant_two_first_name || '';
        } else if (item.required_items.item_name === 'Cognome') {
          nameValue = project.applicant_two_last_name || '';
        }
      } else if (item.participant_designation === 'solo_applicant') {
        if (item.required_items.item_name === 'Nome') {
          nameValue = project.applicant_one_first_name || '';
        } else if (item.required_items.item_name === 'Cognome') {
          nameValue = project.applicant_one_last_name || '';
        }
      }

      if (nameValue) {
        updates.push({
          id: item.id,
          text_value: nameValue
        });
      }
    }

    // Execute updates
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('project_checklist_items')
          .update({ text_value: update.text_value })
          .eq('id', update.id);

        if (updateError) {
          console.error('❌ Failed to update checklist item:', update.id, updateError);
        } else {
          console.log('✅ Updated checklist item:', update.id, 'with value:', update.text_value);
        }
      }
    }

    console.log('✅ Applicant names population completed');

  } catch (error) {
    console.error('❌ Error in populateApplicantNamesInChecklist:', error);
  }
};
