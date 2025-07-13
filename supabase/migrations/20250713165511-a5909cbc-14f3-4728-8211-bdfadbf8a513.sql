-- Disable RLS on all tables to allow unrestricted access during development
-- This resolves the authentication error where RLS is enabled but no policies exist

-- Disable RLS on core authentication and user management tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokerages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokerage_members DISABLE ROW LEVEL SECURITY;

-- Disable RLS on project-related tables
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_debt_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_secondary_income_items DISABLE ROW LEVEL SECURITY;

-- Disable RLS on simulation tables
ALTER TABLE public.simulations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_members DISABLE ROW LEVEL SECURITY;

-- Disable RLS on invitation and system tables
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_generation_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other core tables
ALTER TABLE public.required_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_logic_rules DISABLE ROW LEVEL SECURITY;