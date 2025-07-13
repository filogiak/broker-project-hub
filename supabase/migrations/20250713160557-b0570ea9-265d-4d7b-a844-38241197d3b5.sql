-- Fix ALL RLS policies with has_role() function calls to eliminate infinite recursion

-- === FIX USER_ROLES TABLE ===
-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow role assignment with valid invitation" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create simple, direct policies without function calls
CREATE POLICY "user_roles_superadmin_all" 
ON public.user_roles 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
);

CREATE POLICY "user_roles_own_select" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "user_roles_invitation_insert" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.invitations i ON i.email = p.email
    WHERE p.id = user_roles.user_id 
      AND i.role = user_roles.role 
      AND i.expires_at > now()
  )
);

-- === FIX BROKERAGES TABLE ===
-- Drop policies with has_role() calls
DROP POLICY IF EXISTS "Brokerage owners can update their brokerages" ON public.brokerages;
DROP POLICY IF EXISTS "Brokerage owners can view their brokerages" ON public.brokerages;
DROP POLICY IF EXISTS "Superadmins can view all brokerages" ON public.brokerages;

-- Create direct policies without function calls
CREATE POLICY "brokerages_superadmin_all" 
ON public.brokerages 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
);

CREATE POLICY "brokerages_owner_select" 
ON public.brokerages 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "brokerages_owner_update" 
ON public.brokerages 
FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "brokerages_member_select" 
ON public.brokerages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.brokerage_members bm
    WHERE bm.brokerage_id = brokerages.id AND bm.user_id = auth.uid()
  )
);

-- === FIX INVITATIONS TABLE ===
-- Drop complex policies with has_role() calls
DROP POLICY IF EXISTS "brokerage_owners_and_assistants_can_create_project_invitations" ON public.invitations;
DROP POLICY IF EXISTS "brokerage_owners_and_assistants_can_delete_project_invitations" ON public.invitations;
DROP POLICY IF EXISTS "brokerage_owners_and_assistants_can_update_project_invitations" ON public.invitations;

-- Create simplified policies without function calls
CREATE POLICY "invitations_brokerage_owner_all" 
ON public.invitations 
FOR ALL
USING (
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.brokerages b ON b.id = p.brokerage_id
    WHERE p.id = invitations.project_id AND b.owner_id = auth.uid()
  )) OR 
  (brokerage_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.brokerages b
    WHERE b.id = invitations.brokerage_id AND b.owner_id = auth.uid()
  ))
);

CREATE POLICY "invitations_broker_assistant_all" 
ON public.invitations 
FOR ALL
USING (
  project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.brokerage_members bm ON bm.brokerage_id = p.brokerage_id
    WHERE p.id = invitations.project_id 
      AND bm.user_id = auth.uid() 
      AND bm.role = 'broker_assistant'
  )
);

CREATE POLICY "invitations_superadmin_all" 
ON public.invitations 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
);