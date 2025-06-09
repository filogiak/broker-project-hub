
-- Add email sending functionality to invitations table
ALTER TABLE public.invitations 
ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN invitation_token TEXT UNIQUE;

-- Create index for faster token lookups
CREATE INDEX idx_invitations_token ON public.invitations(invitation_token);

-- Update the generate_invitation_code function to also create tokens
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate a secure random token (32 characters)
        token := encode(gen_random_bytes(24), 'base64');
        -- Remove URL-unsafe characters
        token := replace(replace(replace(token, '+', ''), '/', ''), '=', '');
        
        -- Check if this token already exists
        SELECT EXISTS(
            SELECT 1 FROM public.invitations 
            WHERE invitation_token = token
        ) INTO exists_check;
        
        -- If token doesn't exist, we can use it
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN token;
END;
$$;
