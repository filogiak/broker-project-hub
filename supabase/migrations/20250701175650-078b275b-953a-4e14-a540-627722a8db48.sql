
-- Create brokerage_members table for brokerage-specific roles
CREATE TABLE public.brokerage_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brokerage_id uuid NOT NULL REFERENCES public.brokerages(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  joined_at timestamp with time zone DEFAULT now(),
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, brokerage_id, role)
);

-- Enable RLS on brokerage_members
ALTER TABLE public.brokerage_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for brokerage_members (similar to project_members)
CREATE POLICY "Users can view brokerage members with safe access check"
  ON public.brokerage_members
  FOR SELECT
  USING (
    user_is_superadmin(auth.uid()) OR
    user_owns_brokerage(brokerage_id, auth.uid()) OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.brokerage_members bm2
      WHERE bm2.brokerage_id = brokerage_members.brokerage_id
        AND bm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Brokerage owners can manage their brokerage members"
  ON public.brokerage_members
  FOR ALL
  USING (user_owns_brokerage(brokerage_id, auth.uid()));

CREATE POLICY "Superadmins can manage all brokerage members"
  ON public.brokerage_members
  FOR ALL
  USING (user_is_superadmin(auth.uid()));

CREATE POLICY "Allow brokerage member assignment with valid invitation"
  ON public.brokerage_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.invitations i ON i.email = p.email
      WHERE p.id = brokerage_members.user_id
        AND p.id = auth.uid()
        AND i.brokerage_id = brokerage_members.brokerage_id
        AND i.role = brokerage_members.role
        AND i.accepted_at IS NULL
        AND i.expires_at > NOW()
    )
  );

-- Helper function to check if user is a member of a brokerage
CREATE OR REPLACE FUNCTION public.user_is_brokerage_member(brokerage_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.brokerage_members 
    WHERE brokerage_id = brokerage_uuid AND user_id = user_uuid
  );
$$;

-- Helper function to get user's roles in a specific brokerage
CREATE OR REPLACE FUNCTION public.get_user_brokerage_roles(brokerage_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS user_role[]
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(role) 
  FROM public.brokerage_members 
  WHERE brokerage_id = brokerage_uuid AND user_id = user_uuid;
$$;

-- Update get_brokerage_users function to use brokerage_members instead of profiles.brokerage_id
CREATE OR REPLACE FUNCTION public.get_brokerage_users(brokerage_uuid uuid)
RETURNS TABLE(id uuid, email text, first_name text, last_name text, phone text, roles user_role[])
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    ARRAY_AGG(bm.role) as roles
  FROM public.profiles p
  JOIN public.brokerage_members bm ON bm.user_id = p.id
  WHERE bm.brokerage_id = brokerage_uuid
  GROUP BY p.id, p.email, p.first_name, p.last_name, p.phone;
$$;

-- Migration: Move existing profiles.brokerage_id to brokerage_members
-- This will populate brokerage_members with existing user-brokerage relationships
INSERT INTO public.brokerage_members (user_id, brokerage_id, role, invited_by, joined_at, invited_at)
SELECT 
  p.id as user_id,
  p.brokerage_id,
  ur.role,
  b.owner_id as invited_by,
  NOW() as joined_at,
  p.created_at as invited_at
FROM public.profiles p
JOIN public.brokerages b ON b.id = p.brokerage_id
JOIN public.user_roles ur ON ur.user_id = p.id
WHERE p.brokerage_id IS NOT NULL
  AND ur.role IN ('simulation_collaborator', 'broker_assistant', 'real_estate_agent', 'brokerage_owner')
ON CONFLICT (user_id, brokerage_id, role) DO NOTHING;
