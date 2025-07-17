-- Add RLS policies for simulation invitations

-- Allow simulation owners/members to view outgoing invitations for their simulations
CREATE POLICY "Authorized users can view simulation invitations" 
ON public.invitations 
FOR SELECT 
USING (
  (simulation_id IS NOT NULL) AND (
    user_owns_simulation_brokerage(simulation_id, auth.uid()) OR
    user_is_superadmin(auth.uid()) OR
    user_created_simulation(simulation_id, auth.uid()) OR
    user_is_simulation_member(simulation_id, auth.uid())
  )
);

-- Allow users to view invitations they created
CREATE POLICY "Users can view invitations they created" 
ON public.invitations 
FOR SELECT 
USING (invited_by = auth.uid());

-- Allow authorized users to update simulation invitations (for resend, cancel)
CREATE POLICY "Authorized users can update simulation invitations" 
ON public.invitations 
FOR UPDATE 
USING (
  (simulation_id IS NOT NULL) AND (
    user_owns_simulation_brokerage(simulation_id, auth.uid()) OR
    user_is_superadmin(auth.uid()) OR
    user_created_simulation(simulation_id, auth.uid()) OR
    user_is_simulation_member(simulation_id, auth.uid())
  )
);

-- Allow authorized users to delete simulation invitations
CREATE POLICY "Authorized users can delete simulation invitations" 
ON public.invitations 
FOR DELETE 
USING (
  (simulation_id IS NOT NULL) AND (
    user_owns_simulation_brokerage(simulation_id, auth.uid()) OR
    user_is_superadmin(auth.uid()) OR
    user_created_simulation(simulation_id, auth.uid()) OR
    user_is_simulation_member(simulation_id, auth.uid())
  )
);