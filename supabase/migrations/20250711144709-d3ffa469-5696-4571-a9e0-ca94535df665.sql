-- Allow brokerage members to view their brokerages
CREATE POLICY "Brokerage members can view their brokerages" 
ON public.brokerages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.brokerage_members bm 
    WHERE bm.brokerage_id = brokerages.id 
      AND bm.user_id = auth.uid()
  )
);