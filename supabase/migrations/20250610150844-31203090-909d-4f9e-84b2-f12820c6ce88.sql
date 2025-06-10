
-- Update the user_roles INSERT policy to allow role assignment during invitation acceptance
DROP POLICY IF EXISTS "Allow role assignment with valid invitation" ON public.user_roles;

CREATE POLICY "Allow role assignment with valid invitation" 
  ON public.user_roles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.invitations i ON i.email = p.email
      WHERE p.id = user_id
        AND p.id = auth.uid()
        AND i.role = user_roles.role
        AND i.expires_at > NOW()
        -- Removed the accepted_at IS NULL condition to allow role assignment during acceptance
    )
  );
