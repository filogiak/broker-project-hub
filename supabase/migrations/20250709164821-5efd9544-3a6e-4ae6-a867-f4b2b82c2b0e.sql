-- Remove unused checklist_rules table and condition_operator enum
-- These are legacy components that are no longer used in the application

-- Drop the checklist_rules table first (this will cascade any constraints)
DROP TABLE IF EXISTS public.checklist_rules CASCADE;

-- Drop the condition_operator enum type
DROP TYPE IF EXISTS public.condition_operator CASCADE;