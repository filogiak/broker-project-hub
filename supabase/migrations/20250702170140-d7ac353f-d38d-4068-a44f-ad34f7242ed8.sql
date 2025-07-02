
-- Fix RLS recursion issues in simulation_members table
-- Create security definer functions to prevent infinite recursion

-- Function to check if user owns a brokerage (for simulation context)
CREATE OR REPLACE FUNCTION public.user_owns_simulation_brokerage(simulation_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.simulations s
    JOIN public.brokerages b ON b.id = s.brokerage_id
    WHERE s.id = simulation_uuid AND b.owner_id = user_uuid
  );
$$;

-- Function to check if user is a simulation member
CREATE OR REPLACE FUNCTION public.user_is_simulation_member(simulation_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.simulation_members 
    WHERE simulation_id = simulation_uuid AND user_id = user_uuid
  );
$$;

-- Function to check if user created a simulation
CREATE OR REPLACE FUNCTION public.user_created_simulation(simulation_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.simulations 
    WHERE id = simulation_uuid AND created_by = user_uuid
  );
$$;

-- Update simulation_members RLS policies to use security definer functions
DROP POLICY IF EXISTS "Superadmins can manage all simulation members" ON public.simulation_members;
DROP POLICY IF EXISTS "Brokerage owners can manage simulation members" ON public.simulation_members;
DROP POLICY IF EXISTS "Simulation creators can manage members" ON public.simulation_members;
DROP POLICY IF EXISTS "Users can view simulation members for their simulations" ON public.simulation_members;

-- Recreate policies with security definer functions
CREATE POLICY "Superadmins can manage all simulation members"
ON public.simulation_members
FOR ALL
TO authenticated
USING (user_is_superadmin(auth.uid()));

CREATE POLICY "Brokerage owners can manage simulation members"
ON public.simulation_members
FOR ALL
TO authenticated
USING (user_owns_simulation_brokerage(simulation_id, auth.uid()));

CREATE POLICY "Simulation creators can manage members" 
ON public.simulation_members
FOR ALL
TO authenticated
USING (user_created_simulation(simulation_id, auth.uid()));

CREATE POLICY "Users can view simulation members for their simulations"
ON public.simulation_members
FOR SELECT
TO authenticated
USING (user_is_simulation_member(simulation_id, auth.uid()));

-- Allow users to insert themselves as simulation members with valid invitation
CREATE POLICY "Allow simulation member assignment with valid invitation"
ON public.simulation_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.invitations i ON i.email = p.email
    WHERE p.id = simulation_members.user_id
      AND p.id = auth.uid()
      AND i.role = simulation_members.role
      AND i.accepted_at IS NULL
      AND i.expires_at > NOW()
  )
);
