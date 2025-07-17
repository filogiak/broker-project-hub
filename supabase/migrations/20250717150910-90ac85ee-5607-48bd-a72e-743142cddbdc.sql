-- Create a test function to verify auth.uid() works in the current context
CREATE OR REPLACE FUNCTION public.test_auth_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  result jsonb;
BEGIN
  -- Get auth.uid()
  current_user_id := auth.uid();
  
  -- Try to get user email from profiles
  IF current_user_id IS NOT NULL THEN
    SELECT email INTO user_email
    FROM public.profiles
    WHERE id = current_user_id;
  END IF;
  
  result := jsonb_build_object(
    'auth_uid', current_user_id,
    'user_email', user_email,
    'auth_context_working', (current_user_id IS NOT NULL),
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;