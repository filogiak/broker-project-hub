
-- Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view project members with safe access check" ON public.project_members;

-- Create simple, direct RLS policies without complex function calls
CREATE POLICY "Superadmins can view all project members" 
ON public.project_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'
  )
);

CREATE POLICY "Brokerage owners can view their project members" 
ON public.project_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.brokerages b ON b.id = p.brokerage_id
    WHERE p.id = project_members.project_id AND b.owner_id = auth.uid()
  )
);

CREATE POLICY "Broker assistants can view project members" 
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

CREATE POLICY "Users can view their own project membership" 
ON public.project_members 
FOR SELECT 
USING (user_id = auth.uid());
