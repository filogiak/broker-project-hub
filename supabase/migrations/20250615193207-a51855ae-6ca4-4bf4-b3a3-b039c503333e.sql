
-- Create question_logic_rules table for conditional form logic
CREATE TABLE public.question_logic_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_item_id UUID NOT NULL REFERENCES public.required_items(id) ON DELETE CASCADE,
  trigger_value TEXT NOT NULL,
  target_subcategory TEXT NOT NULL,
  target_category_id UUID REFERENCES public.items_categories(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_question_logic_rules_trigger_item ON public.question_logic_rules(trigger_item_id);
CREATE INDEX idx_question_logic_rules_active ON public.question_logic_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_question_logic_rules_subcategory ON public.question_logic_rules(target_subcategory);

-- Add comments for clarity
COMMENT ON TABLE public.question_logic_rules IS 'Rules for conditional form logic - triggers additional questions based on answers';
COMMENT ON COLUMN public.question_logic_rules.trigger_item_id IS 'The question item that triggers the conditional logic';
COMMENT ON COLUMN public.question_logic_rules.trigger_value IS 'The answer value that triggers the logic';
COMMENT ON COLUMN public.question_logic_rules.target_subcategory IS 'The subcategory of questions to show when triggered';
COMMENT ON COLUMN public.question_logic_rules.target_category_id IS 'Optional - category where questions should appear (defaults to same category)';
