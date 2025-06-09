
-- Enable email confirmations and update Supabase configuration
-- This will be handled via the config.toml update

-- Add a new table to track invitation acceptance status during verification
CREATE TABLE IF NOT EXISTS public.invitation_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  verification_token UUID NOT NULL DEFAULT gen_random_uuid(),
  verified_at TIMESTAMP WITH TIME ZONE NULL,
  profile_created_at TIMESTAMP WITH TIME ZONE NULL,
  project_added_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(invitation_id, user_id)
);

-- Enable RLS on the verification tracking table
ALTER TABLE public.invitation_verifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own verification records
CREATE POLICY "Users can view their own verification records" 
  ON public.invitation_verifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to update their own verification records
CREATE POLICY "Users can update their own verification records" 
  ON public.invitation_verifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow insertion of verification records (this will be used by the system)
CREATE POLICY "Allow verification record creation" 
  ON public.invitation_verifications 
  FOR INSERT 
  WITH CHECK (true);
