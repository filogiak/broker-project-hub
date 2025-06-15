
-- Phase 1: Create Core Enums
CREATE TYPE project_type AS ENUM (
  'first_home_purchase',
  'refinance', 
  'investment_property',
  'construction_loan',
  'home_equity_loan',
  'reverse_mortgage'
);

CREATE TYPE item_scope AS ENUM (
  'PROJECT',
  'PARTICIPANT'
);

CREATE TYPE item_type AS ENUM (
  'text',
  'number',
  'date',
  'document',
  'repeatable_group',
  'single_choice_dropdown',
  'multiple_choice_checkbox'
);

CREATE TYPE checklist_status AS ENUM (
  'pending',
  'submitted',
  'approved',
  'rejected'
);

CREATE TYPE condition_operator AS ENUM (
  'EQUALS',
  'NOT_EQUALS',
  'GREATER_THAN',
  'LESS_THAN',
  'CONTAINS'
);

-- Phase 2: Create Master Template Tables
CREATE TABLE public.document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.required_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  category_id UUID REFERENCES public.document_categories(id),
  subcategory TEXT,
  subcategory_2 TEXT,
  priority INTEGER DEFAULT 0,
  scope item_scope NOT NULL DEFAULT 'PROJECT',
  item_type item_type NOT NULL DEFAULT 'text',
  project_types_applicable project_type[] DEFAULT '{}',
  validation_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.item_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.required_items(id) ON DELETE CASCADE,
  option_value TEXT NOT NULL,
  option_label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.checklist_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_item_id UUID NOT NULL REFERENCES public.required_items(id) ON DELETE CASCADE,
  condition_operator condition_operator NOT NULL,
  condition_value TEXT NOT NULL,
  target_item_id UUID NOT NULL REFERENCES public.required_items(id) ON DELETE CASCADE,
  is_iterative BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 3: Extend Existing Tables
ALTER TABLE public.projects 
ADD COLUMN project_type project_type,
ADD COLUMN number_of_applicants INTEGER DEFAULT 1,
ADD COLUMN checklist_generated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.project_members 
ADD COLUMN participant_designation TEXT;

-- Phase 4: Create Live Project Data Tables
CREATE TABLE public.project_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.required_items(id) ON DELETE CASCADE,
  participant_designation TEXT,
  status checklist_status DEFAULT 'pending',
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, item_id, participant_designation)
);

CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.required_items(id) ON DELETE CASCADE,
  participant_designation TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  status checklist_status DEFAULT 'pending',
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 5: Create Repeatable Group Tables
CREATE TABLE public.project_secondary_incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  participant_designation TEXT NOT NULL,
  group_index INTEGER NOT NULL DEFAULT 1,
  income_type TEXT,
  employer_name TEXT,
  monthly_amount DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  documentation_provided BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.project_dependents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  participant_designation TEXT NOT NULL,
  group_index INTEGER NOT NULL DEFAULT 1,
  dependent_name TEXT NOT NULL,
  relationship TEXT,
  date_of_birth DATE,
  social_security_number TEXT,
  dependent_on_taxes BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.project_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  participant_designation TEXT NOT NULL,
  group_index INTEGER NOT NULL DEFAULT 1,
  property_address TEXT NOT NULL,
  property_type TEXT,
  current_value DECIMAL(12,2),
  outstanding_mortgage DECIMAL(12,2),
  monthly_payment DECIMAL(12,2),
  rental_income DECIMAL(12,2),
  is_primary_residence BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.project_debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  participant_designation TEXT NOT NULL,
  group_index INTEGER NOT NULL DEFAULT 1,
  debt_type TEXT NOT NULL,
  creditor_name TEXT,
  current_balance DECIMAL(12,2),
  monthly_payment DECIMAL(12,2),
  account_number TEXT,
  is_paid_off BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_required_items_category ON public.required_items(category_id);
CREATE INDEX idx_required_items_scope ON public.required_items(scope);
CREATE INDEX idx_required_items_type ON public.required_items(item_type);
CREATE INDEX idx_project_checklist_project ON public.project_checklist_items(project_id);
CREATE INDEX idx_project_checklist_item ON public.project_checklist_items(item_id);
CREATE INDEX idx_project_documents_project ON public.project_documents(project_id);
CREATE INDEX idx_project_members_designation ON public.project_members(participant_designation);

-- Add unique constraint for project_members with designation
ALTER TABLE public.project_members 
ADD CONSTRAINT unique_project_participant_designation 
UNIQUE(project_id, participant_designation);
