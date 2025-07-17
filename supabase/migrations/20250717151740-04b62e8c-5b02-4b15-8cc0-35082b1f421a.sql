-- Create a secure function to handle brokerage invitation creation
-- This bypasses RLS issues by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_brokerage_invitation(
  p_brokerage_id uuid,
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
  existing_user_id uuid;
  existing_invitation_id uuid;
  result jsonb;
BEGIN
  -- Validate that the inviter has permission
  IF p_invited_by IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;
  
  -- Check if user owns the brokerage or is superadmin
  IF NOT (
    public.user_owns_brokerage(p_brokerage_id, p_invited_by) OR 
    public.user_is_superadmin(p_invited_by)
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authorized to invite users to this brokerage'
    );
  END IF;
  
  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM public.profiles
  WHERE email = p_email;
  
  IF existing_user_id IS NOT NULL THEN
    -- Check if user is already a member
    IF EXISTS (
      SELECT 1 FROM public.brokerage_members
      WHERE brokerage_id = p_brokerage_id 
        AND user_id = existing_user_id 
        AND role = p_role
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'User is already a member of this brokerage with this role'
      );
    END IF;
  END IF;
  
  -- Check for existing pending invitation
  SELECT id INTO existing_invitation_id
  FROM public.invitations
  WHERE brokerage_id = p_brokerage_id
    AND email = p_email
    AND role = p_role
    AND accepted_at IS NULL
    AND expires_at > NOW();
  
  IF existing_invitation_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'There is already a pending invitation for this user'
    );
  END IF;
  
  -- Generate encrypted token
  encrypted_token := public.generate_encrypted_invitation_token();
  
  -- Create the invitation
  INSERT INTO public.invitations (
    brokerage_id,
    email,
    role,
    invited_by,
    encrypted_token
  )
  VALUES (
    p_brokerage_id,
    p_email,
    p_role,
    p_invited_by,
    encrypted_token
  )
  RETURNING id INTO invitation_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', invitation_id,
    'encrypted_token', encrypted_token,
    'message', 'Brokerage invitation created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Failed to create invitation: ' || SQLERRM
  );
END;
$$;