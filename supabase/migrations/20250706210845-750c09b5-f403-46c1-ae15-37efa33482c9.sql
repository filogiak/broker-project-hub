-- Update the get_my_pending_invitations function to include brokerage_id
CREATE OR REPLACE FUNCTION public.get_my_pending_invitations(p_user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_email text;
  result jsonb;
BEGIN
  -- Get user's email
  SELECT email INTO user_email
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF user_email IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  -- Use CTE to properly structure the query and avoid GROUP BY issues
  WITH pending_invitations_cte AS (
    SELECT 
      i.id,
      i.role,
      i.project_id,
      i.brokerage_id,
      p.name as project_name,
      COALESCE(
        CONCAT(prof.first_name, ' ', prof.last_name),
        prof.email,
        'Unknown'
      ) as inviter_name,
      i.created_at,
      i.expires_at,
      EXTRACT(DAY FROM (i.expires_at - NOW())) as days_remaining
    FROM public.invitations i
    LEFT JOIN public.projects p ON p.id = i.project_id
    LEFT JOIN public.profiles prof ON prof.id = i.invited_by
    WHERE i.email = user_email
      AND i.accepted_at IS NULL
      AND i.expires_at > NOW()
    ORDER BY i.created_at DESC
  )
  SELECT jsonb_build_object(
    'invitations', 
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'role', role,
          'project_id', project_id,
          'brokerage_id', brokerage_id,
          'project_name', project_name,
          'inviter_name', inviter_name,
          'created_at', created_at,
          'expires_at', expires_at,
          'days_remaining', days_remaining
        )
      ), 
      '[]'::jsonb
    ),
    'count', 
    COALESCE(
      (SELECT COUNT(*) FROM pending_invitations_cte), 
      0
    )
  ) INTO result
  FROM pending_invitations_cte;
  
  RETURN result;
END;
$function$;