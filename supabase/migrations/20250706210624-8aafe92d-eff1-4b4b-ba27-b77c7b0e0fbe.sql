-- Fix the process_invitation_acceptance function to handle brokerage invitations
CREATE OR REPLACE FUNCTION public.process_invitation_acceptance(p_email text, p_encrypted_token text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    -- Existing user accepting invitation
    target_user_id := p_user_id;
  ELSE
    -- Check if user exists by email
    SELECT id INTO target_user_id
    FROM public.profiles
    WHERE email = p_email;
    
    IF target_user_id IS NULL THEN
      -- This will be handled after user registration
      is_new_user := true;
      RETURN jsonb_build_object(
        'success', true,
        'requires_registration', true,
        'invitation_id', invitation_record.id,
        'email', invitation_record.email,
        'role', invitation_record.role,
        'project_id', invitation_record.project_id,
        'brokerage_id', invitation_record.brokerage_id
      );
    END IF;
  END IF;
  
  -- Check for duplicate project membership (existing logic)
  IF invitation_record.project_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = invitation_record.project_id
        AND user_id = target_user_id
    ) THEN
      -- Mark as accepted but note duplicate
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
  
  -- Check for duplicate brokerage membership (NEW LOGIC)
  IF invitation_record.brokerage_id IS NOT NULL AND invitation_record.project_id IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.brokerage_members
      WHERE brokerage_id = invitation_record.brokerage_id
        AND user_id = target_user_id
        AND role = invitation_record.role
    ) THEN
      -- Mark as accepted but note duplicate
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
  
  BEGIN
    -- Add user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, invitation_record.role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Add to project members if applicable (existing logic)
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
    
    -- Add to brokerage members if applicable (NEW LOGIC)
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
    
    -- Mark invitation as accepted
    UPDATE public.invitations
    SET accepted_at = NOW()
    WHERE id = invitation_record.id;
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Invitation accepted successfully',
      'project_id', invitation_record.project_id,
      'brokerage_id', invitation_record.brokerage_id,
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
$function$;

-- Clean up data: Insert missing brokerage_members record for filogiac21@gmail.com
-- First, let's find the user and brokerage details
INSERT INTO public.brokerage_members (
  brokerage_id,
  user_id,
  role,
  invited_by,
  joined_at
)
SELECT 
  i.brokerage_id,
  p.id as user_id,
  'broker_assistant'::user_role,
  i.invited_by,
  i.accepted_at
FROM public.invitations i
JOIN public.profiles p ON p.email = i.email
WHERE i.email = 'filogiac21@gmail.com'
  AND i.role = 'broker_assistant'
  AND i.brokerage_id IS NOT NULL
  AND i.accepted_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.brokerage_members bm
    WHERE bm.brokerage_id = i.brokerage_id
      AND bm.user_id = p.id
      AND bm.role = 'broker_assistant'
  )
LIMIT 1;