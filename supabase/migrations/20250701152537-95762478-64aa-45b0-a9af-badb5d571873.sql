
-- Phase 1: Database Foundation for Simulations Feature

-- Add new user role for simulation collaborators
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'simulation_collaborator';

-- Create simulations table (parallel to projects but simplified)
CREATE TABLE public.simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  brokerage_id UUID NOT NULL,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_to_project_id UUID NULL,
  converted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create simulation_members table (parallel to project_members)
CREATE TABLE public.simulation_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role user_role NOT NULL,
  participant_designation participant_designation NULL,
  invited_by UUID NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE NULL,
  UNIQUE(simulation_id, user_id)
);

-- Enable RLS on simulations table
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- RLS policies for simulations
CREATE POLICY "Superadmins can manage all simulations" 
  ON public.simulations 
  FOR ALL 
  TO authenticated
  USING (user_is_superadmin(auth.uid()));

CREATE POLICY "Brokerage owners can manage their simulations" 
  ON public.simulations 
  FOR ALL 
  TO authenticated
  USING (user_owns_brokerage(brokerage_id, auth.uid()));

CREATE POLICY "Simulation creators can manage their simulations" 
  ON public.simulations 
  FOR ALL 
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Simulation members can view simulations" 
  ON public.simulations 
  FOR SELECT 
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.simulation_members sm 
    WHERE sm.simulation_id = simulations.id AND sm.user_id = auth.uid()
  ));

-- Enable RLS on simulation_members table
ALTER TABLE public.simulation_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for simulation_members
CREATE POLICY "Superadmins can manage all simulation members" 
  ON public.simulation_members 
  FOR ALL 
  TO authenticated
  USING (user_is_superadmin(auth.uid()));

CREATE POLICY "Brokerage owners can manage simulation members" 
  ON public.simulation_members 
  FOR ALL 
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.simulations s 
    WHERE s.id = simulation_members.simulation_id 
    AND user_owns_brokerage(s.brokerage_id, auth.uid())
  ));

CREATE POLICY "Simulation creators can manage members" 
  ON public.simulation_members 
  FOR ALL 
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.simulations s 
    WHERE s.id = simulation_members.simulation_id 
    AND s.created_by = auth.uid()
  ));

CREATE POLICY "Users can view simulation members for their simulations" 
  ON public.simulation_members 
  FOR SELECT 
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.simulation_members sm2 
    WHERE sm2.simulation_id = simulation_members.simulation_id 
    AND sm2.user_id = auth.uid()
  ));

-- Create database function for simulation creation (following existing pattern)
CREATE OR REPLACE FUNCTION public.safe_create_simulation(
  p_name TEXT,
  p_brokerage_id UUID,
  p_description TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_simulation_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user owns the brokerage, is superadmin, or has simulation_collaborator role
  IF NOT (
    public.user_owns_brokerage(p_brokerage_id, current_user_id) OR 
    public.user_is_superadmin(current_user_id) OR
    public.has_role('simulation_collaborator'::user_role, current_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to create simulations for this brokerage';
  END IF;

  -- Create the simulation
  INSERT INTO public.simulations (
    name, 
    description, 
    brokerage_id, 
    created_by, 
    status
  )
  VALUES (
    p_name, 
    p_description, 
    p_brokerage_id, 
    current_user_id, 
    'draft'
  )
  RETURNING id INTO new_simulation_id;

  -- Add the creator as a simulation member
  INSERT INTO public.simulation_members (
    simulation_id,
    user_id,
    role,
    invited_by,
    joined_at
  ) VALUES (
    new_simulation_id,
    current_user_id,
    CASE 
      WHEN public.user_owns_brokerage(p_brokerage_id, current_user_id) THEN 'brokerage_owner'::user_role
      ELSE 'simulation_collaborator'::user_role
    END,
    current_user_id,
    NOW()
  );

  RETURN new_simulation_id;
END;
$$;

-- Add indexes for better performance
CREATE INDEX idx_simulations_brokerage_id ON public.simulations(brokerage_id);
CREATE INDEX idx_simulations_created_by ON public.simulations(created_by);
CREATE INDEX idx_simulations_status ON public.simulations(status);
CREATE INDEX idx_simulation_members_simulation_id ON public.simulation_members(simulation_id);
CREATE INDEX idx_simulation_members_user_id ON public.simulation_members(user_id);
