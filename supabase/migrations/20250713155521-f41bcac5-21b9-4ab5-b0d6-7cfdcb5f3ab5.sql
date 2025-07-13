-- Drop ALL existing RLS policies on project_members that cause recursion
DROP POLICY IF EXISTS "Broker assistants can manage project members" ON public.project_members;
DROP POLICY IF EXISTS "Broker assistants can view project members" ON public.project_members;
DROP POLICY IF EXISTS "brokerage_owner_projects" ON public.project_members;
DROP POLICY IF EXISTS "superadmin_all" ON public.project_members;
DROP POLICY IF EXISTS "Allow project member assignment with valid invitation" ON public.project_members;

-- Keep only the simple, direct policies we created (they should already exist from previous migration)
-- But let's ensure they exist with proper names

-- Drop and recreate to ensure clean state
DROP POLICY IF EXISTS "Superadmins can view all project members" ON public.project_members;
DROP POLICY IF EXISTS "Brokerage owners can view their project members" ON public.project_members;
DROP POLICY IF EXISTS "Broker assistants can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view their own project membership" ON public.project_members;

-- Create minimal, direct RLS policies without function calls
CREATE POLICY "project_members_superadmin_select" 
ON public.project_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
);

CREATE POLICY "project_members_brokerage_owner_select" 
ON public.project_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.brokerages b ON b.id = p.brokerage_id
    WHERE p.id = project_members.project_id AND b.owner_id = auth.uid()
  )
);

CREATE POLICY "project_members_broker_assistant_select" 
ON public.project_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.brokerage_members bm ON bm.brokerage_id = p.brokerage_id
    WHERE p.id = project_members.project_id 
      AND bm.user_id = auth.uid() 
      AND bm.role = 'broker_assistant'
  )
);

CREATE POLICY "project_members_own_membership_select" 
ON public.project_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Add minimal INSERT/UPDATE/DELETE policies for necessary operations
CREATE POLICY "project_members_superadmin_all" 
ON public.project_members 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
);

CREATE POLICY "project_members_brokerage_owner_all" 
ON public.project_members 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.brokerages b ON b.id = p.brokerage_id
    WHERE p.id = project_members.project_id AND b.owner_id = auth.uid()
  )
);

-- Allow invitation-based member assignment (simplified)
CREATE POLICY "project_members_invitation_insert" 
ON public.project_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.invitations i ON i.email = p.email
    WHERE p.id = project_members.user_id 
      AND i.project_id = project_members.project_id 
      AND i.role = project_members.role 
      AND i.accepted_at IS NULL 
      AND i.expires_at > now()
  )
);