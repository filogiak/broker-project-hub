
-- Remove hardcoded subcategory columns from required_items table
-- This allows unlimited subcategory flows via question_logic_rules
ALTER TABLE public.required_items 
DROP COLUMN IF EXISTS subcategory,
DROP COLUMN IF EXISTS subcategory_2,
DROP COLUMN IF EXISTS subcategory_1_initiator,
DROP COLUMN IF EXISTS subcategory_2_initiator;

-- Add a simple flag to indicate if a question is a multi-flow initiator
-- This replaces the specific subcategory_1_initiator and subcategory_2_initiator flags
ALTER TABLE public.required_items 
ADD COLUMN is_multi_flow_initiator boolean DEFAULT false;

-- Migrate any existing logic rules that might reference the old subcategory fields
-- Update any existing questions that had subcategory_1_initiator or subcategory_2_initiator set to true
UPDATE public.required_items 
SET is_multi_flow_initiator = true 
WHERE id IN (
  SELECT DISTINCT trigger_item_id 
  FROM public.question_logic_rules 
  WHERE is_active = true
);

-- Add index for better performance on multi-flow queries
CREATE INDEX IF NOT EXISTS idx_required_items_multi_flow ON public.required_items(is_multi_flow_initiator) 
WHERE is_multi_flow_initiator = true;

-- Add constraint to ensure target_subcategory is not empty
ALTER TABLE public.question_logic_rules 
ADD CONSTRAINT check_target_subcategory_not_empty 
CHECK (target_subcategory IS NOT NULL AND trim(target_subcategory) != '');

-- Add constraint to ensure trigger_value is not empty  
ALTER TABLE public.question_logic_rules 
ADD CONSTRAINT check_trigger_value_not_empty 
CHECK (trigger_value IS NOT NULL AND trim(trigger_value) != '');
