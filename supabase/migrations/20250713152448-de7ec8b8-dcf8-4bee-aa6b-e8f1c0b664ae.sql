
-- Update the user_can_view_project_members function to only check specific account types
CREATE OR REPLACE FUNCTION public.user_can_view_project_members(project_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Check if user is superadmin
  SELECT public.user_is_superadmin(user_uuid)
  OR
  -- Check if user owns the brokerage (direct join to avoid recursion)
  EXISTS (
    SELECT 1 FROM public.brokerages b
    JOIN public.projects p ON p.brokerage_id = b.id
    WHERE p.id = project_uuid AND b.owner_id = user_uuid
  )
  OR
  -- Check if user is a broker assistant for the project's brokerage
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_uuid 
      AND public.user_is_broker_assistant_for_brokerage(p.brokerage_id, user_uuid)
  );
$$;

-- Add RLS policy for broker assistants to manage project members
CREATE POLICY "Broker assistants can manage project members" 
ON public.project_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id 
      AND public.user_is_broker_assistant_for_brokerage(p.brokerage_id, auth.uid())
  )
);

-- Update invitation policies to allow broker assistants to create/manage invitations
DROP POLICY IF EXISTS "brokerage_owners_can_create_project_invitations" ON public.invitations;
DROP POLICY IF EXISTS "brokerage_owners_can_delete_project_invitations" ON public.invitations;
DROP POLICY IF EXISTS "brokerage_owners_can_update_project_invitations" ON public.invitations;

CREATE POLICY "brokerage_owners_and_assistants_can_create_project_invitations" 
ON public.invitations 
FOR INSERT 
WITH CHECK (
  (has_role('brokerage_owner'::user_role, auth.uid()) OR 
   (project_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id 
        AND public.user_is_broker_assistant_for_brokerage(p.brokerage_id, auth.uid())
    )
   )
  ) AND 
  (((project_id IS NOT NULL) AND user_owns_project_brokerage(project_id, auth.uid())) OR 
   (project_id IS NULL) OR
   (project_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id 
        AND public.user_is_broker_assistant_for_brokerage(p.brokerage_id, auth.uid())
    )
   )
  )
);

CREATE POLICY "brokerage_owners_and_assistants_can_delete_project_invitations" 
ON public.invitations 
FOR DELETE 
USING (
  (has_role('brokerage_owner'::user_role, auth.uid()) OR 
   (project_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id 
        AND public.user_is_broker_assistant_for_brokerage(p.brokerage_id, auth.uid())
    )
   )
  ) AND 
  (((project_id IS NOT NULL) AND user_owns_project_brokerage(project_id, auth.uid())) OR 
   (project_id IS NULL) OR
   (project_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id 
        AND public.user_is_broker_assistant_for_brokerage(p.brokerage_id, auth.uid())
    )
   )
  )
);

CREATE POLICY "brokerage_owners_and_assistants_can_update_project_invitations" 
ON public.invitations 
FOR UPDATE 
USING (
  (has_role('brokerage_owner'::user_role, auth.uid()) OR 
   (project_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id 
        AND public.user_is_broker_assistant_for_brokerage(p.brokerage_id, auth.uid())
    )
   )
  ) AND 
  (((project_id IS NOT NULL) AND user_owns_project_brokerage(project_id, auth.uid())) OR 
   (project_id IS NULL) OR
   (project_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id 
        AND public.user_is_broker_assistant_for_brokerage(p.brokerage_id, auth.uid())
    )
   )
  )
);
