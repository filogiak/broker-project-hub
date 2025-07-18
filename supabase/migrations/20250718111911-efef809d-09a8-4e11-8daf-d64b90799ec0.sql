-- Add foreign key relationship between brokerage_members and profiles
ALTER TABLE public.brokerage_members 
ADD CONSTRAINT brokerage_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;