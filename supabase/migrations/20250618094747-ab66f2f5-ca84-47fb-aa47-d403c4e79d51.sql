
-- Add repeatable group configuration columns to required_items table
ALTER TABLE public.required_items ADD COLUMN IF NOT EXISTS repeatable_group_title TEXT;
ALTER TABLE public.required_items ADD COLUMN IF NOT EXISTS repeatable_group_subtitle TEXT;
ALTER TABLE public.required_items ADD COLUMN IF NOT EXISTS repeatable_group_top_button_text TEXT DEFAULT 'Add';
ALTER TABLE public.required_items ADD COLUMN IF NOT EXISTS repeatable_group_start_button_text TEXT DEFAULT 'Start';

-- Create enum for target tables
DO $$ BEGIN
    CREATE TYPE repeatable_group_target_table AS ENUM (
        'project_secondary_incomes',
        'project_dependents', 
        'project_debts'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add target table column to required_items
ALTER TABLE public.required_items ADD COLUMN IF NOT EXISTS repeatable_group_target_table repeatable_group_target_table;

-- Create project_secondary_income_items table (matches project_checklist_items structure)
CREATE TABLE IF NOT EXISTS public.project_secondary_income_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.required_items(id) ON DELETE CASCADE,
    group_index INTEGER NOT NULL DEFAULT 1,
    participant_designation participant_designation,
    status checklist_status DEFAULT 'pending',
    value TEXT,
    text_value TEXT,
    numeric_value NUMERIC,
    date_value DATE,
    boolean_value BOOLEAN,
    json_value JSONB,
    document_reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, item_id, group_index, participant_designation)
);

-- Create project_dependent_items table (matches project_checklist_items structure)
CREATE TABLE IF NOT EXISTS public.project_dependent_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.required_items(id) ON DELETE CASCADE,
    group_index INTEGER NOT NULL DEFAULT 1,
    participant_designation participant_designation,
    status checklist_status DEFAULT 'pending',
    value TEXT,
    text_value TEXT,
    numeric_value NUMERIC,
    date_value DATE,
    boolean_value BOOLEAN,
    json_value JSONB,
    document_reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, item_id, group_index, participant_designation)
);

-- Create project_debt_items table (matches project_checklist_items structure)
CREATE TABLE IF NOT EXISTS public.project_debt_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.required_items(id) ON DELETE CASCADE,
    group_index INTEGER NOT NULL DEFAULT 1,
    participant_designation participant_designation,
    status checklist_status DEFAULT 'pending',
    value TEXT,
    text_value TEXT,
    numeric_value NUMERIC,
    date_value DATE,
    boolean_value BOOLEAN,
    json_value JSONB,
    document_reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, item_id, group_index, participant_designation)
);

-- Enable RLS on new tables
ALTER TABLE public.project_secondary_income_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_dependent_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_debt_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_secondary_income_items
CREATE POLICY "Users can view project secondary income items they have access to"
ON public.project_secondary_income_items FOR SELECT
USING (public.user_can_access_project(project_id));

CREATE POLICY "Users can insert project secondary income items for accessible projects"
ON public.project_secondary_income_items FOR INSERT
WITH CHECK (public.user_can_access_project(project_id));

CREATE POLICY "Users can update project secondary income items for accessible projects"
ON public.project_secondary_income_items FOR UPDATE
USING (public.user_can_access_project(project_id));

CREATE POLICY "Users can delete project secondary income items for accessible projects"
ON public.project_secondary_income_items FOR DELETE
USING (public.user_can_access_project(project_id));

-- Create RLS policies for project_dependent_items
CREATE POLICY "Users can view project dependent items they have access to"
ON public.project_dependent_items FOR SELECT
USING (public.user_can_access_project(project_id));

CREATE POLICY "Users can insert project dependent items for accessible projects"
ON public.project_dependent_items FOR INSERT
WITH CHECK (public.user_can_access_project(project_id));

CREATE POLICY "Users can update project dependent items for accessible projects"
ON public.project_dependent_items FOR UPDATE
USING (public.user_can_access_project(project_id));

CREATE POLICY "Users can delete project dependent items for accessible projects"
ON public.project_dependent_items FOR DELETE
USING (public.user_can_access_project(project_id));

-- Create RLS policies for project_debt_items
CREATE POLICY "Users can view project debt items they have access to"
ON public.project_debt_items FOR SELECT
USING (public.user_can_access_project(project_id));

CREATE POLICY "Users can insert project debt items for accessible projects"
ON public.project_debt_items FOR INSERT
WITH CHECK (public.user_can_access_project(project_id));

CREATE POLICY "Users can update project debt items for accessible projects"
ON public.project_debt_items FOR UPDATE
USING (public.user_can_access_project(project_id));

CREATE POLICY "Users can delete project debt items for accessible projects"
ON public.project_debt_items FOR DELETE
USING (public.user_can_access_project(project_id));
