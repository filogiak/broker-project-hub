
-- Add answer_id column to required_items table
ALTER TABLE public.required_items 
ADD COLUMN answer_id TEXT;

-- Add a unique constraint on answer_id when it's not null
-- This ensures answer_ids are unique across all questions when provided
ALTER TABLE public.required_items 
ADD CONSTRAINT unique_answer_id 
UNIQUE (answer_id);

-- Add a comment to document the purpose of this field
COMMENT ON COLUMN public.required_items.answer_id IS 'Unique identifier for the question answer, used for better recognition and selection of questions';
