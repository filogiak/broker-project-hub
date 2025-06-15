
-- Add subcategory initiator boolean fields to required_items table
ALTER TABLE public.required_items 
ADD COLUMN subcategory_1_initiator BOOLEAN DEFAULT false,
ADD COLUMN subcategory_2_initiator BOOLEAN DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN public.required_items.subcategory_1_initiator IS 'Indicates if this item initiates subcategory 1 logic';
COMMENT ON COLUMN public.required_items.subcategory_2_initiator IS 'Indicates if this item initiates subcategory 2 logic';
