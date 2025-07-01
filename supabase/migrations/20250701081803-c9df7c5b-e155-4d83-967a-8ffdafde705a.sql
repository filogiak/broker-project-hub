
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

-- Remove the unnecessary get_my_sent_invitations function since we reverted the sent invitations widget
DROP FUNCTION IF EXISTS public.get_my_sent_invitations(uuid);
