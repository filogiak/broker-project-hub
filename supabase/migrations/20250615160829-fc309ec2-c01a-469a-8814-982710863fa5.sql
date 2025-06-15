
-- Create form_generation_rules table for managing rule logic
CREATE TABLE public.form_generation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('base_selection', 'conditional', 'participant_duplication', 'repeatable_group')),
  condition_logic JSONB NOT NULL DEFAULT '{}',
  target_criteria JSONB NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_form_generation_rules_type ON public.form_generation_rules(rule_type);
CREATE INDEX idx_form_generation_rules_active ON public.form_generation_rules(is_active);
CREATE INDEX idx_form_generation_rules_priority ON public.form_generation_rules(priority);

-- Add missing columns to project_checklist_items table for proper typing support
ALTER TABLE public.project_checklist_items 
ADD COLUMN IF NOT EXISTS text_value TEXT,
ADD COLUMN IF NOT EXISTS numeric_value NUMERIC,
ADD COLUMN IF NOT EXISTS date_value DATE,
ADD COLUMN IF NOT EXISTS boolean_value BOOLEAN,
ADD COLUMN IF NOT EXISTS json_value JSONB,
ADD COLUMN IF NOT EXISTS document_reference_id UUID;

-- Create function to generate checklist items for a project
CREATE OR REPLACE FUNCTION public.generate_project_checklist_items(
  p_project_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_record RECORD;
  rule_record RECORD;
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
  
  -- Phase 1: Base question selection - get all required items that match project criteria
  FOR item_record IN
    SELECT ri.*
    FROM public.required_items ri
    WHERE (
      ri.project_types_applicable IS NULL 
      OR ri.project_types_applicable = '{}' 
      OR project_record.project_type = ANY(ri.project_types_applicable)
    )
    ORDER BY ri.priority ASC, ri.created_at ASC
  LOOP
    -- For each required item, create checklist items based on scope
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
      
      items_created := items_created + 1;
      
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
        
        items_created := items_created + 1;
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

-- Create trigger to automatically generate checklist items when project is created
CREATE OR REPLACE FUNCTION public.auto_generate_checklist_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Generate checklist items for new project
  PERFORM public.generate_project_checklist_items(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger on projects table
DROP TRIGGER IF EXISTS trigger_auto_generate_checklist ON public.projects;
CREATE TRIGGER trigger_auto_generate_checklist
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_checklist_items();

-- Add unique constraint to prevent duplicate checklist items
ALTER TABLE public.project_checklist_items
ADD CONSTRAINT unique_project_item_participant 
UNIQUE (project_id, item_id, participant_designation);

-- Enable RLS on form_generation_rules
ALTER TABLE public.form_generation_rules ENABLE ROW LEVEL SECURITY;

-- Create policy for form_generation_rules (allow read for authenticated users)
CREATE POLICY "Users can view form generation rules" 
  ON public.form_generation_rules 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);
