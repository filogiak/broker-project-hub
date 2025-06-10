
-- Drop the existing policy that uses auth.uid()
DROP POLICY IF EXISTS "users_can_view_their_invitations" ON public.invitations;

-- Create updated policy for users to view invitations they sent (using profiles)
CREATE POLICY "users_can_view_invitations_they_sent" ON public.invitations
FOR SELECT TO authenticated
USING (
  invited_by IN (
    SELECT id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create new policy for users to view invitations sent to their email
CREATE POLICY "users_can_view_invitations_sent_to_them" ON public.invitations
FOR SELECT TO authenticated
USING (
  email IN (
    SELECT email FROM public.profiles WHERE id = auth.uid()
  )
  AND encrypted_token IS NOT NULL 
  AND expires_at > now() 
  AND accepted_at IS NULL
);
