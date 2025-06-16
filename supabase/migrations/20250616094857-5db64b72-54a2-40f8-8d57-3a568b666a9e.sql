
-- Update the database function to respect subcategory logic during form generation
CREATE OR REPLACE FUNCTION public.generate_project_checklist_items(
  p_project_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_record RECORD;
  item_record RECORD;
  items_created INTEGER := 0;
  participant_designations TEXT[];
BEGIN
  -- Get project details
  SELECT * INTO project_record
  FROM public.projects
  WHERE id = p_project_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found: %', p_project_id;
  END IF;
  
  -- Determine participant designations based on applicant count
  CASE project_record.applicant_count
    WHEN 'one_applicant' THEN
      participant_designations := ARRAY['solo_applicant'];
    WHEN 'two_applicants' THEN
      participant_designations := ARRAY['applicant_one', 'applicant_two'];
    WHEN 'three_or_more_applicants' THEN
      participant_designations := ARRAY['applicant_one', 'applicant_two'];
    ELSE
      participant_designations := ARRAY['solo_applicant'];
  END CASE;
  
  -- Filter and create checklist items based on the three core rules
  FOR item_record IN
    SELECT ri.*
    FROM public.required_items ri
    WHERE (
      -- Rule 1: Check project_types_applicable
      ri.project_types_applicable IS NULL 
      OR ri.project_types_applicable = '{}' 
      OR project_record.project_type = ANY(ri.project_types_applicable)
    )
    AND (
      -- Rule 3: Only include main questions and initiator questions
      ri.subcategory IS NULL 
      OR ri.subcategory_1_initiator = true 
      OR ri.subcategory_2_initiator = true
    )
    ORDER BY ri.priority ASC, ri.created_at ASC
  LOOP
    -- Rule 2: Handle scope and participant designation
    IF item_record.scope = 'PROJECT' THEN
      -- Single project-level item
      INSERT INTO public.project_checklist_items (
        project_id,
        item_id,
        status
      ) VALUES (
        p_project_id,
        item_record.id,
        'pending'
      ) ON CONFLICT (project_id, item_id, participant_designation) DO NOTHING;
      
      IF FOUND THEN
        items_created := items_created + 1;
      END IF;
      
    ELSIF item_record.scope = 'PARTICIPANT' THEN
      -- Create one item per participant
      FOR i IN 1..array_length(participant_designations, 1) LOOP
        INSERT INTO public.project_checklist_items (
          project_id,
          item_id,
          participant_designation,
          status
        ) VALUES (
          p_project_id,
          item_record.id,
          participant_designations[i]::participant_designation,
          'pending'
        ) ON CONFLICT (project_id, item_id, participant_designation) DO NOTHING;
        
        IF FOUND THEN
          items_created := items_created + 1;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  
  -- Update project to mark checklist as generated
  UPDATE public.projects
  SET checklist_generated_at = now()
  WHERE id = p_project_id;
  
  RETURN items_created;
END;
$$;
