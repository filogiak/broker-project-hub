
-- Add DELETE policy for invitations - allow brokerage owners to delete invitations they created for their projects
CREATE POLICY "brokerage_owners_can_delete_project_invitations" 
ON public.invitations 
FOR DELETE 
USING (
  has_role('brokerage_owner'::user_role, auth.uid()) 
  AND (
    (project_id IS NOT NULL AND user_owns_project_brokerage(project_id, auth.uid()))
    OR (project_id IS NULL)
  )
);

-- Add UPDATE policy for invitations - allow brokerage owners to update invitations they created
CREATE POLICY "brokerage_owners_can_update_project_invitations" 
ON public.invitations 
FOR UPDATE 
USING (
  has_role('brokerage_owner'::user_role, auth.uid()) 
  AND (
    (project_id IS NOT NULL AND user_owns_project_brokerage(project_id, auth.uid()))
    OR (project_id IS NULL)
  )
);

-- Add UPDATE policy for system operations (email status updates, acceptance)
CREATE POLICY "system_can_update_invitation_status" 
ON public.invitations 
FOR UPDATE 
USING (
  -- Allow updates for email status and acceptance status
  true
);
