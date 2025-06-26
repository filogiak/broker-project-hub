
-- Restore the missing trigger that automatically processes invitations when a profile is created
-- This trigger was somehow lost and is essential for the invitation system to work

CREATE TRIGGER trigger_handle_invitation_on_profile_creation
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invitation_on_profile_creation();
