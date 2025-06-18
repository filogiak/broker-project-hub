
-- Remove all RLS policies from repeatable group tables
ALTER TABLE public.project_secondary_income_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_dependent_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_debt_items DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view own secondary income items" ON public.project_secondary_income_items;
DROP POLICY IF EXISTS "Users can create own secondary income items" ON public.project_secondary_income_items;
DROP POLICY IF EXISTS "Users can update own secondary income items" ON public.project_secondary_income_items;
DROP POLICY IF EXISTS "Users can delete own secondary income items" ON public.project_secondary_income_items;

DROP POLICY IF EXISTS "Users can view own dependent items" ON public.project_dependent_items;
DROP POLICY IF EXISTS "Users can create own dependent items" ON public.project_dependent_items;
DROP POLICY IF EXISTS "Users can update own dependent items" ON public.project_dependent_items;
DROP POLICY IF EXISTS "Users can delete own dependent items" ON public.project_dependent_items;

DROP POLICY IF EXISTS "Users can view own debt items" ON public.project_debt_items;
DROP POLICY IF EXISTS "Users can create own debt items" ON public.project_debt_items;
DROP POLICY IF EXISTS "Users can update own debt items" ON public.project_debt_items;
DROP POLICY IF EXISTS "Users can delete own debt items" ON public.project_debt_items;
