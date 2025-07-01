
-- Fix the GROUP BY clause error in get_my_pending_invitations function
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
  
  -- Get pending invitations (fixed GROUP BY clause)
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

-- Create function to get sent invitations for brokerage owners
CREATE OR REPLACE FUNCTION public.get_my_sent_invitations(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sent_invitations jsonb;
BEGIN
  -- Get invitations sent by this user
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'email', i.email,
      'role', i.role,
      'project_id', i.project_id,
      'project_name', p.name,
      'created_at', i.created_at,
      'expires_at', i.expires_at,
      'accepted_at', i.accepted_at,
      'email_sent', i.email_sent,
      'status', CASE 
        WHEN i.accepted_at IS NOT NULL THEN 'accepted'
        WHEN i.email_sent = false THEN 'email_failed'
        WHEN i.expires_at <= NOW() THEN 'expired'
        ELSE 'pending'
      END,
      'days_remaining', CASE 
        WHEN i.expires_at > NOW() THEN EXTRACT(DAY FROM (i.expires_at - NOW()))
        ELSE 0
      END
    )
  ) INTO sent_invitations
  FROM public.invitations i
  LEFT JOIN public.projects p ON p.id = i.project_id
  WHERE i.invited_by = p_user_id
  ORDER BY i.created_at DESC;
  
  RETURN jsonb_build_object(
    'invitations', COALESCE(sent_invitations, '[]'::jsonb),
    'count', COALESCE(jsonb_array_length(sent_invitations), 0)
  );
END;
$$;
