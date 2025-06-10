
-- Add INSERT policy for profiles table to allow profile creation during signup
-- This policy allows users to create their own profile when there's a valid invitation
CREATE POLICY "Allow profile creation with valid invitation" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND
    EXISTS (
      SELECT 1 FROM public.invitations i
      WHERE i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND i.accepted_at IS NULL
        AND i.expires_at > NOW()
    )
  );

-- Add INSERT policy for user_roles table to allow role assignment during signup
-- This policy allows users to insert their role when there's a valid invitation
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
        AND i.accepted_at IS NULL
        AND i.expires_at > NOW()
    )
  );

-- Update the existing project_members INSERT policy to work with profiles
DROP POLICY IF EXISTS "Allow user to join with valid invitation" ON public.project_members;

CREATE POLICY "Allow project member assignment with valid invitation" 
  ON public.project_members 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.invitations i ON i.email = p.email
      WHERE p.id = user_id
        AND p.id = auth.uid()
        AND i.project_id = project_members.project_id
        AND i.role = project_members.role
        AND i.accepted_at IS NULL
        AND i.expires_at > NOW()
    )
  );
