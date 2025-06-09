
-- Check current invitations table structure and add fields for email-based invitations
-- Add columns to support the new email-based flow if they don't exist

-- Add email_sent column to track if invitation email was sent
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'email_sent') THEN
        ALTER TABLE public.invitations ADD COLUMN email_sent boolean DEFAULT false;
    END IF;
END $$;

-- Add encrypted_token column for secure invitation links
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'encrypted_token') THEN
        ALTER TABLE public.invitations ADD COLUMN encrypted_token text;
    END IF;
END $$;

-- Add used_at column to track when invitation was used
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'used_at') THEN
        ALTER TABLE public.invitations ADD COLUMN used_at timestamp with time zone;
    END IF;
END $$;

-- Create index on encrypted_token for fast lookups
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'invitations' AND indexname = 'idx_invitations_encrypted_token') THEN
        CREATE INDEX idx_invitations_encrypted_token ON public.invitations(encrypted_token);
    END IF;
END $$;

-- Function to generate secure encrypted invitation tokens
CREATE OR REPLACE FUNCTION public.generate_encrypted_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate a secure random token (64 characters)
        token := encode(gen_random_bytes(48), 'base64');
        -- Remove URL-unsafe characters and make URL-friendly
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
    END LOOP;
    
    RETURN token;
END;
$$;
