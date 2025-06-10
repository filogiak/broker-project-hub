
-- Drop the unused invitation_verifications table and its policies
DROP POLICY IF EXISTS "Users can view their own verification records" ON public.invitation_verifications;
DROP POLICY IF EXISTS "Users can update their own verification records" ON public.invitation_verifications;
DROP POLICY IF EXISTS "Allow verification record creation" ON public.invitation_verifications;

-- Drop the table
DROP TABLE IF EXISTS public.invitation_verifications;
