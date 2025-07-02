
-- Add the missing foreign key constraint between simulation_members and simulations
ALTER TABLE public.simulation_members 
ADD CONSTRAINT simulation_members_simulation_id_fkey 
FOREIGN KEY (simulation_id) REFERENCES public.simulations(id) ON DELETE CASCADE;

-- Also add foreign key for invited_by to profiles table if missing
ALTER TABLE public.simulation_members 
ADD CONSTRAINT simulation_members_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key for user_id to profiles table if missing  
ALTER TABLE public.simulation_members 
ADD CONSTRAINT simulation_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
