
-- Restore the subcategory columns that were removed
ALTER TABLE public.required_items 
ADD COLUMN subcategory text,
ADD COLUMN subcategory_2 text,
ADD COLUMN subcategory_1_initiator boolean DEFAULT false,
ADD COLUMN subcategory_2_initiator boolean DEFAULT false;

-- Remove the constraints that were added (they may conflict with existing data)
ALTER TABLE public.question_logic_rules 
DROP CONSTRAINT IF EXISTS check_target_subcategory_not_empty,
DROP CONSTRAINT IF EXISTS check_trigger_value_not_empty;

-- Keep the is_multi_flow_initiator column as it's useful for the new functionality
-- The index we created is also fine to keep

-- Note: We're keeping the is_multi_flow_initiator column as it will be used
-- for the new optional multi-flow functionality without breaking existing features
