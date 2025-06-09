
-- Fix the generate_encrypted_invitation_token function
-- This function generates secure URL-friendly tokens for email invitations

DROP FUNCTION IF EXISTS public.generate_encrypted_invitation_token();

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
