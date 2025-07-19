-- Add the missing foreign key relationship between brokerage_members.user_id and profiles.id
ALTER TABLE public.brokerage_members 
ADD CONSTRAINT brokerage_members_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;