
-- First, let's check if the user profile exists
SELECT id, email, first_name, last_name FROM public.profiles 
WHERE email = 'giacometti.filippo@gmail.com';

-- Check if this user already has any roles
SELECT ur.role FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE p.email = 'giacometti.filippo@gmail.com';

-- Assign superadmin role to the user
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'superadmin'::user_role
FROM public.profiles p
WHERE p.email = 'giacometti.filippo@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was assigned correctly
SELECT p.email, ur.role 
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.email = 'giacometti.filippo@gmail.com';
