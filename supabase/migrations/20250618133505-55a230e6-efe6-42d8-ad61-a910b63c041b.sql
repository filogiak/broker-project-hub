
-- First, change the column type to text to remove the enum dependency
ALTER TABLE public.required_items 
ALTER COLUMN repeatable_group_target_table TYPE text;

-- Now we can safely drop the enum type
DROP TYPE IF EXISTS public.repeatable_group_target_table;

-- Create the new enum with values that exactly match the table names
CREATE TYPE public.repeatable_group_target_table AS ENUM (
    'project_secondary_income_items',
    'project_dependent_items', 
    'project_debt_items'
);

-- Convert the column back to use the new enum type
ALTER TABLE public.required_items 
ALTER COLUMN repeatable_group_target_table 
TYPE public.repeatable_group_target_table 
USING repeatable_group_target_table::public.repeatable_group_target_table;
