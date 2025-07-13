
-- Update safe_create_project to only allow brokerage owners and broker assistants
CREATE OR REPLACE FUNCTION public.safe_create_project(p_name text, p_brokerage_id uuid, p_description text DEFAULT NULL::text, p_project_type project_type DEFAULT NULL::project_type, p_applicant_count applicant_count DEFAULT 'one_applicant'::applicant_count, p_has_guarantor boolean DEFAULT false, p_applicant_one_first_name text DEFAULT NULL::text, p_applicant_one_last_name text DEFAULT NULL::text, p_applicant_two_first_name text DEFAULT NULL::text, p_applicant_two_last_name text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_project_id uuid;
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user owns the brokerage, is superadmin, or is specifically a broker assistant
  -- Only these roles can create projects
  IF NOT (
    public.user_owns_brokerage(p_brokerage_id, current_user_id) OR 
    public.user_is_superadmin(current_user_id) OR
    public.user_is_broker_assistant_for_brokerage(p_brokerage_id, current_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to create projects for this brokerage';
  END IF;

  -- Create the project with applicant names
  INSERT INTO public.projects (
    name, 
    description, 
    brokerage_id, 
    created_by, 
    status, 
    project_type, 
    applicant_count, 
    has_guarantor,
    applicant_one_first_name,
    applicant_one_last_name,
    applicant_two_first_name,
    applicant_two_last_name
  )
  VALUES (
    p_name, 
    p_description, 
    p_brokerage_id, 
    current_user_id, 
    'active', 
    p_project_type, 
    p_applicant_count, 
    p_has_guarantor,
    p_applicant_one_first_name,
    p_applicant_one_last_name,
    p_applicant_two_first_name,
    p_applicant_two_last_name
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

  -- Also add the creator as a project member if they're not the owner
  IF NOT public.user_owns_brokerage(p_brokerage_id, current_user_id) THEN
    INSERT INTO public.project_members (
      project_id,
      user_id,
      role,
      invited_by,
      joined_at
    ) VALUES (
      new_project_id,
      current_user_id,
      'broker_assistant'::user_role,
      current_user_id,
      NOW()
    ) ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;

  RETURN new_project_id;
END;
$$;

-- Update safe_create_simulation to allow all brokerage members (not just broker assistants)
CREATE OR REPLACE FUNCTION public.safe_create_simulation(p_name text, p_brokerage_id uuid, p_description text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_simulation_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user owns the brokerage, is superadmin, or is ANY type of brokerage member
  -- All brokerage members can create simulations
  IF NOT (
    public.user_owns_brokerage(p_brokerage_id, current_user_id) OR 
    public.user_is_superadmin(current_user_id) OR
    public.user_is_brokerage_member(p_brokerage_id, current_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to create simulations for this brokerage';
  END IF;

  -- Create the simulation
  INSERT INTO public.simulations (
    name, 
    description, 
    brokerage_id, 
    created_by, 
    status
  )
  VALUES (
    p_name, 
    p_description, 
    p_brokerage_id, 
    current_user_id, 
    'draft'
  )
  RETURNING id INTO new_simulation_id;

  -- Add the creator as a simulation member
  INSERT INTO public.simulation_members (
    simulation_id,
    user_id,
    role,
    invited_by,
    joined_at
  ) VALUES (
    new_simulation_id,
    current_user_id,
    CASE 
      WHEN public.user_owns_brokerage(p_brokerage_id, current_user_id) THEN 'brokerage_owner'::user_role
      ELSE 'simulation_collaborator'::user_role
    END,
    current_user_id,
    NOW()
  );

  RETURN new_simulation_id;
END;
$$;
