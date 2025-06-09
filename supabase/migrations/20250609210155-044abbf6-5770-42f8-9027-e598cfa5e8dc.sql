
-- Step 1: Fix the ambiguous token columns in invitations table
-- Remove the old token column and keep only encrypted_token and invitation_code

-- First, let's see what columns we have and clean up
ALTER TABLE public.invitations DROP COLUMN IF EXISTS token CASCADE;
ALTER TABLE public.invitations DROP COLUMN IF EXISTS invitation_token CASCADE;

-- Ensure we have the right columns for the email-based flow
-- encrypted_token: for email-based invitations (modern approach)
-- invitation_code: for legacy code-based invitations (fallback)

-- Add email_sent_at column if it doesn't exist (for tracking)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'email_sent_at') THEN
        ALTER TABLE public.invitations ADD COLUMN email_sent_at timestamp with time zone;
    END IF;
END $$;

-- Update the generate_encrypted_invitation_token function to be more robust
CREATE OR REPLACE FUNCTION public.generate_encrypted_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token TEXT;
    exists_check BOOLEAN;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    LOOP
        attempts := attempts + 1;
        
        -- Generate a secure random token (URL-safe base64, ~64 characters)
        token := encode(gen_random_bytes(48), 'base64');
        -- Make it URL-safe
        token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');
        
        -- Check if this token already exists
        SELECT EXISTS(
            SELECT 1 FROM public.invitations 
            WHERE encrypted_token = token
        ) INTO exists_check;
        
        -- If token doesn't exist, we can use it
        IF NOT exists_check THEN
            EXIT;
        END IF;
        
        -- Prevent infinite loops
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique token after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    RETURN token;
END;
$$;
