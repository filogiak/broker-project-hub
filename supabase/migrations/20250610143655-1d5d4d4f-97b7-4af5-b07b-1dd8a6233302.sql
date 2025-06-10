
-- First, drop the existing RLS policies that depend on invitation_code
DROP POLICY IF EXISTS "Allow unauthenticated invitation validation" ON public.invitations;
DROP POLICY IF EXISTS "Allow authenticated invitation validation" ON public.invitations;

-- Now we can safely remove the invitation_code column
ALTER TABLE public.invitations DROP COLUMN IF EXISTS invitation_code;

-- Drop the related function since it's no longer needed
DROP FUNCTION IF EXISTS public.generate_invitation_code();

-- Add the new RLS policy to allow anonymous users to validate encrypted tokens
CREATE POLICY "Allow anonymous token validation" ON public.invitations
FOR SELECT TO anon
USING (
  encrypted_token IS NOT NULL 
  AND expires_at > now() 
  AND accepted_at IS NULL
);
