
-- Add RLS policy to allow project members to view profiles of other members in the same projects
CREATE POLICY "Project members can view profiles of other project members" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Allow users to see their own profile
  auth.uid() = id
  OR
  -- Allow users to see profiles of other users who are in the same projects
  EXISTS (
    SELECT 1 
    FROM public.project_members pm1
    JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = auth.uid() 
      AND pm2.user_id = profiles.id
  )
);
