-- Phase 1: Database Extensions for Simulation Invitations

-- 1. Add simulation_id column to invitations table
ALTER TABLE public.invitations 
ADD COLUMN simulation_id UUID REFERENCES public.simulations(id);

-- 2. Add constraint to ensure only one invitation type per record
ALTER TABLE public.invitations 
ADD CONSTRAINT check_single_invitation_type 
CHECK (
  (project_id IS NOT NULL AND brokerage_id IS NULL AND simulation_id IS NULL) OR
  (project_id IS NULL AND brokerage_id IS NOT NULL AND simulation_id IS NULL) OR
  (project_id IS NULL AND brokerage_id IS NULL AND simulation_id IS NOT NULL)
);

-- 3. Enable RLS on invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for invitations table
-- Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations" 
ON public.invitations 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE email = invitations.email
  )
);

-- Authorized users can create project invitations (existing functionality)
CREATE POLICY "Authorized users can create project invitations" 
ON public.invitations 
FOR INSERT 
WITH CHECK (
  project_id IS NOT NULL AND
  (
    public.user_owns_project_brokerage(project_id, auth.uid()) OR
    public.user_is_superadmin(auth.uid()) OR
    public.user_is_broker_assistant_for_brokerage(
      (SELECT brokerage_id FROM public.projects WHERE id = project_id), 
      auth.uid()
    )
  )
);

-- Authorized users can create brokerage invitations
CREATE POLICY "Authorized users can create brokerage invitations" 
ON public.invitations 
FOR INSERT 
WITH CHECK (
  brokerage_id IS NOT NULL AND
  (
    public.user_owns_brokerage(brokerage_id, auth.uid()) OR
    public.user_is_superadmin(auth.uid())
  )
);

-- Authorized users can create simulation invitations
CREATE POLICY "Authorized users can create simulation invitations" 
ON public.invitations 
FOR INSERT 
WITH CHECK (
  simulation_id IS NOT NULL AND
  (
    public.user_owns_simulation_brokerage(simulation_id, auth.uid()) OR
    public.user_is_superadmin(auth.uid()) OR
    public.user_created_simulation(simulation_id, auth.uid()) OR
    public.user_is_simulation_member(simulation_id, auth.uid())
  )
);

-- Users can update their own invitations (for acceptance)
CREATE POLICY "Users can update their own invitations" 
ON public.invitations 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE email = invitations.email
  )
);

-- 5. Update the process_invitation_acceptance function to handle simulation invitations
CREATE OR REPLACE FUNCTION public.process_invitation_acceptance(p_email text, p_encrypted_token text, p_user_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  target_user_id uuid;
  result jsonb;
  is_new_user boolean := false;
BEGIN
  -- Validate and get invitation
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE email = p_email
    AND encrypted_token = p_encrypted_token
    AND accepted_at IS NULL
    AND expires_at > NOW();
  
  IF invitation_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation token'
    );
  END IF;
  
  -- Determine target user ID
  IF p_user_id IS NOT NULL THEN
    target_user_id := p_user_id;
  ELSE
    SELECT id INTO target_user_id
    FROM public.profiles
    WHERE email = p_email;
    
    IF target_user_id IS NULL THEN
      is_new_user := true;
      RETURN jsonb_build_object(
        'success', true,
        'requires_registration', true,
        'invitation_id', invitation_record.id,
        'email', invitation_record.email,
        'role', invitation_record.role,
        'project_id', invitation_record.project_id,
        'brokerage_id', invitation_record.brokerage_id,
        'simulation_id', invitation_record.simulation_id
      );
    END IF;
  END IF;
  
  -- Check for duplicate project membership
  IF invitation_record.project_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = invitation_record.project_id
        AND user_id = target_user_id
    ) THEN
      UPDATE public.invitations
      SET accepted_at = NOW()
      WHERE id = invitation_record.id;
      
      RETURN jsonb_build_object(
        'success', true,
        'message', 'You are already a member of this project',
        'project_id', invitation_record.project_id,
        'duplicate_membership', true
      );
    END IF;
  END IF;
  
  -- Check for duplicate brokerage membership
  IF invitation_record.brokerage_id IS NOT NULL AND invitation_record.project_id IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.brokerage_members
      WHERE brokerage_id = invitation_record.brokerage_id
        AND user_id = target_user_id
        AND role = invitation_record.role
    ) THEN
      UPDATE public.invitations
      SET accepted_at = NOW()
      WHERE id = invitation_record.id;
      
      RETURN jsonb_build_object(
        'success', true,
        'message', 'You are already a member of this brokerage with this role',
        'brokerage_id', invitation_record.brokerage_id,
        'duplicate_membership', true
      );
    END IF;
  END IF;
  
  -- Check for duplicate simulation membership (NEW)
  IF invitation_record.simulation_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.simulation_members
      WHERE simulation_id = invitation_record.simulation_id
        AND user_id = target_user_id
    ) THEN
      UPDATE public.invitations
      SET accepted_at = NOW()
      WHERE id = invitation_record.id;
      
      RETURN jsonb_build_object(
        'success', true,
        'message', 'You are already a member of this simulation',
        'simulation_id', invitation_record.simulation_id,
        'duplicate_membership', true
      );
    END IF;
  END IF;
  
  BEGIN
    -- Add user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, invitation_record.role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Add to project members if applicable
    IF invitation_record.project_id IS NOT NULL THEN
      INSERT INTO public.project_members (
        project_id,
        user_id,
        role,
        invited_by,
        joined_at
      )
      VALUES (
        invitation_record.project_id,
        target_user_id,
        invitation_record.role,
        invitation_record.invited_by,
        NOW()
      );
    END IF;
    
    -- Add to brokerage members if applicable
    IF invitation_record.brokerage_id IS NOT NULL AND invitation_record.project_id IS NULL THEN
      INSERT INTO public.brokerage_members (
        brokerage_id,
        user_id,
        role,
        invited_by,
        joined_at
      )
      VALUES (
        invitation_record.brokerage_id,
        target_user_id,
        invitation_record.role,
        invitation_record.invited_by,
        NOW()
      );
    END IF;
    
    -- Add to simulation members if applicable (NEW)
    IF invitation_record.simulation_id IS NOT NULL THEN
      INSERT INTO public.simulation_members (
        simulation_id,
        user_id,
        role,
        invited_by,
        joined_at
      )
      VALUES (
        invitation_record.simulation_id,
        target_user_id,
        invitation_record.role,
        invitation_record.invited_by,
        NOW()
      );
    END IF;
    
    -- Mark invitation as accepted
    UPDATE public.invitations
    SET accepted_at = NOW()
    WHERE id = invitation_record.id;
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Invitation accepted successfully',
      'project_id', invitation_record.project_id,
      'brokerage_id', invitation_record.brokerage_id,
      'simulation_id', invitation_record.simulation_id,
      'role', invitation_record.role,
      'is_new_user', is_new_user
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to process invitation: ' || SQLERRM
    );
  END;
  
  RETURN result;
END;
$$;

-- 6. Create helper function for creating simulation invitations
CREATE OR REPLACE FUNCTION public.create_simulation_invitation(
  p_simulation_id uuid,
  p_email text,
  p_role user_role,
  p_invited_by uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_id uuid;
  encrypted_token text;
BEGIN
  -- Verify user has permission to invite to this simulation
  IF NOT (
    public.user_owns_simulation_brokerage(p_simulation_id, p_invited_by) OR
    public.user_is_superadmin(p_invited_by) OR
    public.user_created_simulation(p_simulation_id, p_invited_by) OR
    public.user_is_simulation_member(p_simulation_id, p_invited_by)
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authorized to invite users to this simulation'
    );
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.simulation_members sm
    JOIN public.profiles p ON p.id = sm.user_id
    WHERE sm.simulation_id = p_simulation_id 
      AND p.email = p_email
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is already a member of this simulation'
    );
  END IF;
  
  -- Check if there's already a pending invitation
  IF EXISTS (
    SELECT 1 FROM public.invitations
    WHERE simulation_id = p_simulation_id
      AND email = p_email
      AND accepted_at IS NULL
      AND expires_at > NOW()
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'There is already a pending invitation for this user'
    );
  END IF;
  
  -- Generate encrypted token
  encrypted_token := public.generate_encrypted_invitation_token();
  
  -- Create the invitation
  INSERT INTO public.invitations (
    simulation_id,
    email,
    role,
    invited_by,
    encrypted_token,
    expires_at
  )
  VALUES (
    p_simulation_id,
    p_email,
    p_role,
    p_invited_by,
    encrypted_token,
    NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO invitation_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', invitation_id,
    'message', 'Simulation invitation created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Failed to create invitation: ' || SQLERRM
  );
END;
$$;