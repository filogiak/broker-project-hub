
-- Phase 1: Foundation Changes

-- Delete the incorrectly designed project_properties table
DROP TABLE IF EXISTS public.project_properties;

-- Create applicant_count enum
CREATE TYPE applicant_count AS ENUM (
  'one_applicant',
  'two_applicants', 
  'three_or_more_applicants'
);

-- Create participant_designation enum
CREATE TYPE participant_designation AS ENUM (
  'solo_applicant',
  'applicant_one',
  'applicant_two'
);

-- Phase 2: Update projects table
-- Replace number_of_applicants INTEGER with applicant_count enum
ALTER TABLE public.projects 
DROP COLUMN number_of_applicants,
ADD COLUMN applicant_count applicant_count DEFAULT 'one_applicant';

-- Update project_members table
-- Replace participant_designation TEXT with enum
ALTER TABLE public.project_members 
DROP COLUMN participant_designation,
ADD COLUMN participant_designation participant_designation;

-- Phase 3: Update all related tables to use the new participant_designation enum
ALTER TABLE public.project_checklist_items 
DROP COLUMN participant_designation,
ADD COLUMN participant_designation participant_designation;

ALTER TABLE public.project_documents 
DROP COLUMN participant_designation,
ADD COLUMN participant_designation participant_designation;

ALTER TABLE public.project_secondary_incomes 
DROP COLUMN participant_designation,
ADD COLUMN participant_designation participant_designation NOT NULL DEFAULT 'solo_applicant';

ALTER TABLE public.project_dependents 
DROP COLUMN participant_designation,
ADD COLUMN participant_designation participant_designation NOT NULL DEFAULT 'solo_applicant';

ALTER TABLE public.project_debts 
DROP COLUMN participant_designation,
ADD COLUMN participant_designation participant_designation NOT NULL DEFAULT 'solo_applicant';

-- Phase 4: Recreate project_properties table with proper enum structure
CREATE TABLE public.project_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  participant_designation participant_designation NOT NULL,
  group_index INTEGER NOT NULL DEFAULT 1,
  property_address TEXT NOT NULL,
  property_type TEXT,
  current_value DECIMAL(12,2),
  outstanding_mortgage DECIMAL(12,2),
  monthly_payment DECIMAL(12,2),
  rental_income DECIMAL(12,2),
  is_primary_residence BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 5: Create auto-assignment function
CREATE OR REPLACE FUNCTION public.auto_assign_participant_designation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_applicant_count applicant_count;
  existing_applicant_count INTEGER;
BEGIN
  -- Only process mortgage_applicant role
  IF NEW.role != 'mortgage_applicant' THEN
    RETURN NEW;
  END IF;

  -- Get the project's applicant count setting
  SELECT applicant_count INTO project_applicant_count
  FROM public.projects
  WHERE id = NEW.project_id;

  -- For one_applicant projects, always assign solo_applicant
  IF project_applicant_count = 'one_applicant' THEN
    NEW.participant_designation := 'solo_applicant';
    RETURN NEW;
  END IF;

  -- For two_applicants or three_or_more_applicants projects
  -- Count existing mortgage applicants
  SELECT COUNT(*) INTO existing_applicant_count
  FROM public.project_members
  WHERE project_id = NEW.project_id 
    AND role = 'mortgage_applicant'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Assign designation based on order
  IF existing_applicant_count = 0 THEN
    NEW.participant_designation := 'applicant_one';
  ELSIF existing_applicant_count = 1 THEN
    NEW.participant_designation := 'applicant_two';
  ELSE
    -- For three_or_more_applicants, we could extend this logic
    -- For now, default to applicant_two for additional applicants
    NEW.participant_designation := 'applicant_two';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto-assignment
CREATE TRIGGER auto_assign_participant_designation_trigger
  BEFORE INSERT OR UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_participant_designation();

-- Phase 6: Add validation constraints
-- Ensure solo_applicant only appears in one_applicant projects
CREATE OR REPLACE FUNCTION public.validate_participant_designation_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  project_applicant_count applicant_count;
BEGIN
  -- Get project's applicant count
  SELECT applicant_count INTO project_applicant_count
  FROM public.projects
  WHERE id = NEW.project_id;

  -- Validation rules
  IF project_applicant_count = 'one_applicant' AND NEW.participant_designation != 'solo_applicant' THEN
    RAISE EXCEPTION 'One applicant projects can only have solo_applicant designation';
  END IF;

  IF project_applicant_count != 'one_applicant' AND NEW.participant_designation = 'solo_applicant' THEN
    RAISE EXCEPTION 'Solo applicant designation can only be used in one applicant projects';
  END IF;

  RETURN NEW;
END;
$$;

-- Apply validation trigger to project_members
CREATE TRIGGER validate_participant_designation_trigger
  BEFORE INSERT OR UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_participant_designation_consistency();

-- Create indexes for better performance
CREATE INDEX idx_project_members_designation ON public.project_members(participant_designation);
CREATE INDEX idx_projects_applicant_count ON public.projects(applicant_count);
CREATE INDEX idx_project_properties_designation ON public.project_properties(participant_designation);
