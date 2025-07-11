-- Step 1: Create a Security Definer Function for safe brokerage access check
CREATE OR REPLACE FUNCTION public.user_can_view_brokerage_members(brokerage_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- This function bypasses RLS to safely check brokerage membership
  -- without causing infinite recursion
  SELECT EXISTS (
    SELECT 1 FROM public.brokerage_members 
    WHERE brokerage_id = brokerage_uuid AND user_id = user_uuid
  );
$$;

-- Step 2: Drop and recreate the problematic RLS policy without recursion
DROP POLICY IF EXISTS "Users can view brokerage members with safe access check" ON public.brokerage_members;

CREATE POLICY "Users can view brokerage members with safe access check"
  ON public.brokerage_members
  FOR SELECT
  USING (
    user_is_superadmin(auth.uid()) OR
    user_owns_brokerage(brokerage_id, auth.uid()) OR
    user_id = auth.uid() OR
    user_can_view_brokerage_members(brokerage_id, auth.uid())
  );