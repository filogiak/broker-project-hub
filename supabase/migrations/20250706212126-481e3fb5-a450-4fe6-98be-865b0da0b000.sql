-- Clean up all memberships for filogiac21@gmail.com for testing
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID for filogiac21@gmail.com
    SELECT id INTO target_user_id 
    FROM public.profiles 
    WHERE email = 'filogiac21@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Remove from brokerage_members
        DELETE FROM public.brokerage_members 
        WHERE user_id = target_user_id;
        
        -- Remove from project_members
        DELETE FROM public.project_members 
        WHERE user_id = target_user_id;
        
        -- Remove from simulation_members
        DELETE FROM public.simulation_members 
        WHERE user_id = target_user_id;
        
        -- Log the cleanup
        RAISE NOTICE 'Cleaned up all memberships for user: % (ID: %)', 'filogiac21@gmail.com', target_user_id;
    ELSE
        RAISE NOTICE 'User not found: %', 'filogiac21@gmail.com';
    END IF;
END $$;