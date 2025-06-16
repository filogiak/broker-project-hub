
-- Add 3 more subcategory columns and their corresponding initiator flags
ALTER TABLE public.required_items 
ADD COLUMN subcategory_3 text,
ADD COLUMN subcategory_4 text,
ADD COLUMN subcategory_5 text,
ADD COLUMN subcategory_3_initiator boolean DEFAULT false,
ADD COLUMN subcategory_4_initiator boolean DEFAULT false,
ADD COLUMN subcategory_5_initiator boolean DEFAULT false;

-- Add comments to document the purpose of these fields
COMMENT ON COLUMN public.required_items.subcategory_3 IS 'Third subcategory that this question belongs to or can trigger';
COMMENT ON COLUMN public.required_items.subcategory_4 IS 'Fourth subcategory that this question belongs to or can trigger';
COMMENT ON COLUMN public.required_items.subcategory_5 IS 'Fifth subcategory that this question belongs to or can trigger';
COMMENT ON COLUMN public.required_items.subcategory_3_initiator IS 'Whether this question initiates subcategory_3 logic';
COMMENT ON COLUMN public.required_items.subcategory_4_initiator IS 'Whether this question initiates subcategory_4 logic';
COMMENT ON COLUMN public.required_items.subcategory_5_initiator IS 'Whether this question initiates subcategory_5 logic';
