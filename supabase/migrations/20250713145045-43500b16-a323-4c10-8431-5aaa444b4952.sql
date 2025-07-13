
-- Create function to check if user is a broker assistant for a specific brokerage
CREATE OR REPLACE FUNCTION public.user_is_broker_assistant_for_brokerage(brokerage_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.brokerage_members 
    WHERE brokerage_id = brokerage_uuid 
      AND user_id = user_uuid 
      AND role = 'broker_assistant'::user_role
  );
$$;

-- Add RLS policy for broker assistants to view all projects in their brokerage
CREATE POLICY "Broker assistants can view brokerage projects" 
ON public.projects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.brokerage_members bm
    WHERE bm.brokerage_id = projects.brokerage_id 
      AND bm.user_id = auth.uid() 
      AND bm.role = 'broker_assistant'::user_role
  )
);

-- Update existing projects RLS policy to be more comprehensive
DROP POLICY IF EXISTS "Users can view projects they own or are members of" ON public.projects;

CREATE POLICY "Users can view accessible projects" 
ON public.projects 
FOR SELECT 
USING (
  user_is_superadmin(auth.uid()) OR 
  user_owns_brokerage(brokerage_id, auth.uid()) OR 
  (created_by = auth.uid()) OR 
  user_is_project_member(id, auth.uid()) OR
  user_is_broker_assistant_for_brokerage(brokerage_id, auth.uid())
);
