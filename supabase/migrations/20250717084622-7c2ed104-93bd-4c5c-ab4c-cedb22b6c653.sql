-- Add foreign key constraint between simulations and brokerages
ALTER TABLE public.simulations 
ADD CONSTRAINT simulations_brokerage_id_fkey 
FOREIGN KEY (brokerage_id) REFERENCES public.brokerages(id) ON DELETE CASCADE;