
-- Phase 1: Simplified Backend-Only Invitation System
-- Replace existing functions with a comprehensive backend solution

-- Enhanced function to check invitation status and user existence in one call
CREATE OR REPLACE FUNCTION public.check_invitation_status(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean := false;
  user_id uuid;
  pending_invitations jsonb;
  result jsonb;
BEGIN
  -- Check if user exists
  SELECT id INTO user_id
  FROM public.profiles
  WHERE email = p_email;
  
  user_exists := (user_id IS NOT NULL);
  
  -- Get pending invitations for this email
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'role', i.role,
      'project_id', i.project_id,
      'project_name', p.name,
      'inviter_name', COALESCE(
        CONCAT(prof.first_name, ' ', prof.last_name),
        prof.email,
        'Unknown'
      ),
      'created_at', i.created_at,
      'expires_at', i.expires_at
    )
  ) INTO pending_invitations
  FROM public.invitations i
  LEFT JOIN public.projects p ON p.id = i.project_id
  LEFT JOIN public.profiles prof ON prof.id = i.invited_by
  WHERE i.email = p_email
    AND i.accepted_at IS NULL
    AND i.expires_at > NOW();
  
  result := jsonb_build_object(
    'user_exists', user_exists,
    'user_id', user_id,
    'pending_invitations', COALESCE(pending_invitations, '[]'::jsonb),
    'invitation_count', COALESCE(jsonb_array_length(pending_invitations), 0)
  );
  
  RETURN result;
END;
$$;

-- Unified function to process invitations (works for both new and existing users)
CREATE OR REPLACE FUNCTION public.process_invitation_acceptance(
  p_email text,
  p_encrypted_token text,
  p_user_id uuid DEFAULT NULL
)
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
        'project_id', invitation_record.project_id
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
    
    -- Mark invitation as accepted
    UPDATE public.invitations
    SET accepted_at = NOW()
    WHERE id = invitation_record.id;
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Invitation accepted successfully',
      'project_id', invitation_record.project_id,
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

-- Function to get all pending invitations for a logged-in user
CREATE OR REPLACE FUNCTION public.get_my_pending_invitations(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  pending_invitations jsonb;
BEGIN
  -- Get user's email
  SELECT email INTO user_email
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF user_email IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  -- Get pending invitations
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'role', i.role,
      'project_id', i.project_id,
      'project_name', p.name,
      'inviter_name', COALESCE(
        CONCAT(prof.first_name, ' ', prof.last_name),
        prof.email,
        'Unknown'
      ),
      'created_at', i.created_at,
      'expires_at', i.expires_at,
      'days_remaining', EXTRACT(DAY FROM (i.expires_at - NOW()))
    )
  ) INTO pending_invitations
  FROM public.invitations i
  LEFT JOIN public.projects p ON p.id = i.project_id
  LEFT JOIN public.profiles prof ON prof.id = i.invited_by
  WHERE i.email = user_email
    AND i.accepted_at IS NULL
    AND i.expires_at > NOW()
  ORDER BY i.created_at DESC;
  
  RETURN jsonb_build_object(
    'invitations', COALESCE(pending_invitations, '[]'::jsonb),
    'count', COALESCE(jsonb_array_length(pending_invitations), 0)
  );
END;
$$;

-- Function to accept invitation by ID (for logged-in users)
CREATE OR REPLACE FUNCTION public.accept_invitation_by_id(
  p_invitation_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  invitation_record RECORD;
  result jsonb;
BEGIN
  -- Get user's email
  SELECT email INTO user_email
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Get and validate invitation
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE id = p_invitation_id
    AND email = user_email
    AND accepted_at IS NULL
    AND expires_at > NOW();
  
  IF invitation_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;
  
  -- Use the main processing function
  SELECT public.process_invitation_acceptance(
    user_email,
    invitation_record.encrypted_token,
    p_user_id
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_invitations_email_token 
ON public.invitations (email, encrypted_token) 
WHERE accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invitations_email_pending 
ON public.invitations (email, accepted_at, expires_at) 
WHERE accepted_at IS NULL;
