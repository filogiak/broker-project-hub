
-- Add has_guarantor boolean field to projects table
ALTER TABLE public.projects 
ADD COLUMN has_guarantor BOOLEAN DEFAULT false;

-- Update the safe_create_project function to handle new parameters
CREATE OR REPLACE FUNCTION public.safe_create_project(
  p_name text, 
  p_brokerage_id uuid, 
  p_description text DEFAULT NULL::text,
  p_project_type project_type DEFAULT NULL::project_type,
  p_applicant_count applicant_count DEFAULT 'one_applicant'::applicant_count,
  p_has_guarantor boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_project_id uuid;
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user owns the brokerage or is superadmin
  IF NOT (
    public.user_owns_brokerage(p_brokerage_id, current_user_id) OR 
    public.user_is_superadmin(current_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to create projects for this brokerage';
  END IF;

  -- Create the project with new fields
  INSERT INTO public.projects (
    name, 
    description, 
    brokerage_id, 
    created_by, 
    status, 
    project_type, 
    applicant_count, 
    has_guarantor
  )
  VALUES (
    p_name, 
    p_description, 
    p_brokerage_id, 
    current_user_id, 
    'active', 
    p_project_type, 
    p_applicant_count, 
    p_has_guarantor
  )
  RETURNING id INTO new_project_id;

  -- Add the brokerage owner as a project member
  INSERT INTO public.project_members (
    project_id,
    user_id,
    role,
    invited_by,
    joined_at
  ) 
  SELECT 
    new_project_id,
    b.owner_id,
    'brokerage_owner'::user_role,
    current_user_id,
    NOW()
  FROM public.brokerages b
  WHERE b.id = p_brokerage_id
  ON CONFLICT (project_id, user_id) DO NOTHING;

  RETURN new_project_id;
END;
$function$;
