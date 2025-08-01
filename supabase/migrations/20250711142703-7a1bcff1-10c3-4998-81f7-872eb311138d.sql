-- Fix infinite recursion in brokerage_members RLS policy
-- Step 1: Drop the problematic policy first
DROP POLICY IF EXISTS "Users can view brokerage members with safe access check" ON public.brokerage_members;

-- Step 2: Drop the recursive function
DROP FUNCTION IF EXISTS public.user_can_view_brokerage_members(uuid, uuid);

-- Step 3: Create new non-recursive policy
CREATE POLICY "Users can view brokerage members with safe access check"
  ON public.brokerage_members
  FOR SELECT
  USING (
    user_is_superadmin(auth.uid()) OR
    user_owns_brokerage(brokerage_id, auth.uid()) OR
    user_id = auth.uid()
  );