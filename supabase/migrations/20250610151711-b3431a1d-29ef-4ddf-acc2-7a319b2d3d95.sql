
-- Create a function to automatically handle invitation acceptance when a profile is created
CREATE OR REPLACE FUNCTION public.handle_invitation_on_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Look for pending invitations for this user's email
    SELECT * INTO invitation_record
    FROM public.invitations
    WHERE email = NEW.email
      AND accepted_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    -- If we found a valid invitation, process it
    IF invitation_record.id IS NOT NULL THEN
        -- Add user role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, invitation_record.role)
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Add to project members if invitation has a project
        IF invitation_record.project_id IS NOT NULL THEN
            INSERT INTO public.project_members (
                project_id,
                user_id,
                role,
                invited_by,
                joined_at
            )
            VALUES (
                invitation_record.project_id,
                NEW.id,
                invitation_record.role,
                invitation_record.invited_by,
                NOW()
            )
            ON CONFLICT (project_id, user_id) DO NOTHING;
        END IF;

        -- Mark invitation as accepted
        UPDATE public.invitations
        SET accepted_at = NOW()
        WHERE id = invitation_record.id;

        -- Log successful processing
        RAISE NOTICE 'Invitation processed for user % with role %', NEW.email, invitation_record.role;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger on profiles table to automatically handle invitations
DROP TRIGGER IF EXISTS trigger_handle_invitation_on_profile_creation ON public.profiles;

CREATE TRIGGER trigger_handle_invitation_on_profile_creation
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invitation_on_profile_creation();
