
-- Step 1: Clean up any existing orphaned logic rules before adding constraints
DELETE FROM public.question_logic_rules 
WHERE trigger_item_id NOT IN (SELECT id FROM public.required_items);

DELETE FROM public.question_logic_rules 
WHERE target_category_id IS NOT NULL 
  AND target_category_id NOT IN (SELECT id FROM public.items_categories);

-- Step 2: Add foreign key constraints with CASCADE DELETE
ALTER TABLE public.question_logic_rules 
ADD CONSTRAINT fk_question_logic_rules_trigger_item 
FOREIGN KEY (trigger_item_id) 
REFERENCES public.required_items(id) 
ON DELETE CASCADE;

ALTER TABLE public.question_logic_rules 
ADD CONSTRAINT fk_question_logic_rules_target_category 
FOREIGN KEY (target_category_id) 
REFERENCES public.items_categories(id) 
ON DELETE CASCADE;

-- Step 3: Add indexes for better performance on the foreign key columns
CREATE INDEX IF NOT EXISTS idx_question_logic_rules_trigger_item_fk 
ON public.question_logic_rules(trigger_item_id);

CREATE INDEX IF NOT EXISTS idx_question_logic_rules_target_category_fk 
ON public.question_logic_rules(target_category_id);

-- Add comments to document the foreign key relationships
COMMENT ON CONSTRAINT fk_question_logic_rules_trigger_item ON public.question_logic_rules 
IS 'Foreign key to required_items table - cascades delete when trigger question is deleted';

COMMENT ON CONSTRAINT fk_question_logic_rules_target_category ON public.question_logic_rules 
IS 'Foreign key to items_categories table - cascades delete when target category is deleted';
