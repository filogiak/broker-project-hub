-- Phase 1: Database Schema Enhancement for Enhanced Simulation Implementation

-- 1. Enhance simulations table with applicant_count and project contact fields
ALTER TABLE public.simulations 
ADD COLUMN applicant_count applicant_count DEFAULT 'one_applicant',
ADD COLUMN project_contact_name text,
ADD COLUMN project_contact_email text,
ADD COLUMN project_contact_phone text,
ADD COLUMN setup_completed_at timestamp with time zone,
ADD COLUMN forms_generated_at timestamp with time zone;

-- 2. Create simulation_participants table to store participant details
CREATE TABLE public.simulation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id uuid NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  participant_designation participant_designation NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure unique participant designation per simulation
  UNIQUE(simulation_id, participant_designation)
);

-- 3. Enhance form_links table with simulation association and form classification
ALTER TABLE public.form_links 
ADD COLUMN simulation_id uuid REFERENCES public.simulations(id) ON DELETE CASCADE,
ADD COLUMN participant_designation participant_designation,
ADD COLUMN form_type text CHECK (form_type IN ('project', 'applicant'));

-- Create index for better query performance
CREATE INDEX idx_simulation_participants_simulation_id ON public.simulation_participants(simulation_id);
CREATE INDEX idx_form_links_simulation_id ON public.form_links(simulation_id);

-- 4. Add RLS policies for simulation_participants table
ALTER TABLE public.simulation_participants ENABLE ROW LEVEL SECURITY;

-- Users can view participants for simulations they have access to
CREATE POLICY "Users can view simulation participants for accessible simulations"
ON public.simulation_participants
FOR SELECT
USING (
  user_owns_simulation_brokerage(simulation_id) OR
  user_is_superadmin() OR
  user_created_simulation(simulation_id) OR
  user_is_simulation_member(simulation_id)
);

-- Users can insert participants for simulations they own/created/member of
CREATE POLICY "Users can create simulation participants for accessible simulations"
ON public.simulation_participants
FOR INSERT
WITH CHECK (
  user_owns_simulation_brokerage(simulation_id) OR
  user_is_superadmin() OR
  user_created_simulation(simulation_id) OR
  user_is_simulation_member(simulation_id)
);

-- Users can update participants for simulations they own/created/member of
CREATE POLICY "Users can update simulation participants for accessible simulations"
ON public.simulation_participants
FOR UPDATE
USING (
  user_owns_simulation_brokerage(simulation_id) OR
  user_is_superadmin() OR
  user_created_simulation(simulation_id) OR
  user_is_simulation_member(simulation_id)
);

-- Users can delete participants for simulations they own/created/member of
CREATE POLICY "Users can delete simulation participants for accessible simulations"
ON public.simulation_participants
FOR DELETE
USING (
  user_owns_simulation_brokerage(simulation_id) OR
  user_is_superadmin() OR
  user_created_simulation(simulation_id) OR
  user_is_simulation_member(simulation_id)
);

-- 5. Update existing form_links RLS policies to include simulation access
CREATE POLICY "Users can view form links for accessible simulations"
ON public.form_links
FOR SELECT
USING (
  simulation_id IS NULL OR
  user_owns_simulation_brokerage(simulation_id) OR
  user_is_superadmin() OR
  user_created_simulation(simulation_id) OR
  user_is_simulation_member(simulation_id)
);

CREATE POLICY "Users can create form links for accessible simulations"
ON public.form_links
FOR INSERT
WITH CHECK (
  simulation_id IS NULL OR
  user_owns_simulation_brokerage(simulation_id) OR
  user_is_superadmin() OR
  user_created_simulation(simulation_id) OR
  user_is_simulation_member(simulation_id)
);

-- 6. Create trigger for automatic updated_at timestamp on simulation_participants
CREATE TRIGGER update_simulation_participants_updated_at
BEFORE UPDATE ON public.simulation_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_form_links_updated_at();