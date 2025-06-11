
-- Check if your profile exists and get the user ID
DO $$
DECLARE
    user_profile_id uuid;
BEGIN
    -- Get the user ID for the email
    SELECT id INTO user_profile_id 
    FROM public.profiles 
    WHERE email = 'giacometti.filippo@gmail.com';
    
    -- If profile exists, assign superadmin role
    IF user_profile_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_profile_id, 'superadmin'::user_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Superadmin role assigned to user ID: %', user_profile_id;
    ELSE
        RAISE NOTICE 'No profile found for email: giacometti.filippo@gmail.com';
    END IF;
END $$;

-- Verify the assignment
SELECT 
    p.email, 
    p.id as user_id,
    ur.role,
    ur.created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.email = 'giacometti.filippo@gmail.com';

-- Also check if there are any superadmin users at all
SELECT 
    p.email,
    ur.role,
    ur.created_at
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.role = 'superadmin';
