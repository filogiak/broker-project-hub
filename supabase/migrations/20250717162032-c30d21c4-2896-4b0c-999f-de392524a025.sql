-- Create a secure function to get outbound brokerage invitations
CREATE OR REPLACE FUNCTION public.get_brokerage_outgoing_invitations(p_brokerage_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  role user_role,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  accepted_at timestamp with time zone,
  email_sent boolean,
  email_sent_at timestamp with time zone,
  inviter_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user has permission to view this brokerage's invitations
  IF NOT (
    public.user_owns_brokerage(p_brokerage_id, current_user_id) OR 
    public.user_is_superadmin(current_user_id) OR
    public.user_is_broker_assistant_for_brokerage(p_brokerage_id, current_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to view invitations for this brokerage';
  END IF;

  -- Return outgoing invitations for this brokerage
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.role,
    i.created_at,
    i.expires_at,
    i.accepted_at,
    i.email_sent,
    i.email_sent_at,
    COALESCE(
      CONCAT(p.first_name, ' ', p.last_name),
      p.email,
      'Unknown'
    ) as inviter_name
  FROM public.invitations i
  LEFT JOIN public.profiles p ON p.id = i.invited_by
  WHERE i.brokerage_id = p_brokerage_id
  ORDER BY i.created_at DESC;
END;
$$;