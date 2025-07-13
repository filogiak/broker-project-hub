-- Step 1: Create security definer function to check superadmin status without RLS
CREATE OR REPLACE FUNCTION public.is_user_superadmin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'superadmin'::user_role
  );
$$;

-- Step 2: Drop and recreate user_roles policies
DROP POLICY IF EXISTS "user_roles_superadmin_all" ON public.user_roles;

CREATE POLICY "user_roles_superadmin_all" 
ON public.user_roles 
FOR ALL 
USING (public.is_user_superadmin(auth.uid()));

-- Step 3: Drop and recreate brokerages policies  
DROP POLICY IF EXISTS "brokerages_superadmin_all" ON public.brokerages;

CREATE POLICY "brokerages_superadmin_all" 
ON public.brokerages 
FOR ALL 
USING (public.is_user_superadmin(auth.uid()));

-- Step 4: Drop and recreate invitations policies
DROP POLICY IF EXISTS "invitations_superadmin_all" ON public.invitations;

CREATE POLICY "invitations_superadmin_all" 
ON public.invitations 
FOR ALL 
USING (public.is_user_superadmin(auth.uid()));

-- Step 5: Drop and recreate project_members policies
DROP POLICY IF EXISTS "project_members_superadmin_all" ON public.project_members;
DROP POLICY IF EXISTS "project_members_superadmin_select" ON public.project_members;

CREATE POLICY "project_members_superadmin_all" 
ON public.project_members 
FOR ALL 
USING (public.is_user_superadmin(auth.uid()));

-- Step 6: Drop and recreate projects policies
DROP POLICY IF EXISTS "Superadmins can manage all projects" ON public.projects;

CREATE POLICY "Superadmins can manage all projects" 
ON public.projects 
FOR ALL 
USING (public.is_user_superadmin(auth.uid()));

-- Step 7: Update existing functions to use the new function
DROP FUNCTION IF EXISTS public.is_superadmin(uuid);

CREATE OR REPLACE FUNCTION public.is_superadmin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.is_user_superadmin(user_uuid);
$$;