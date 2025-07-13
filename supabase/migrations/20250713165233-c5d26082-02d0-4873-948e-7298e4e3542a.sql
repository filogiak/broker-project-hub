-- Drop ALL RLS policies from all tables to eliminate recursion issues
-- This allows development to continue without RLS restrictions
-- Security will be re-implemented later

-- Drop all policies from user_roles
DROP POLICY IF EXISTS "user_roles_invitation_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_own_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_superadmin_all" ON public.user_roles;

-- Drop all policies from profiles
DROP POLICY IF EXISTS "Allow profile creation with valid invitation" ON public.profiles;
DROP POLICY IF EXISTS "Project members can view profiles of other project members" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Drop all policies from brokerages
DROP POLICY IF EXISTS "Brokerage members can view their brokerages" ON public.brokerages;
DROP POLICY IF EXISTS "Brokerage owners can insert brokerages" ON public.brokerages;
DROP POLICY IF EXISTS "Brokerage owners can update their own brokerage" ON public.brokerages;
DROP POLICY IF EXISTS "Brokerage owners can view their own brokerage" ON public.brokerages;
DROP POLICY IF EXISTS "Superadmins can delete any brokerage" ON public.brokerages;
DROP POLICY IF EXISTS "Superadmins can insert brokerages for any owner" ON public.brokerages;
DROP POLICY IF EXISTS "Superadmins can update any brokerage" ON public.brokerages;
DROP POLICY IF EXISTS "brokerages_member_select" ON public.brokerages;
DROP POLICY IF EXISTS "brokerages_owner_select" ON public.brokerages;
DROP POLICY IF EXISTS "brokerages_owner_update" ON public.brokerages;
DROP POLICY IF EXISTS "brokerages_superadmin_all" ON public.brokerages;

-- Drop all policies from brokerage_members
DROP POLICY IF EXISTS "Allow brokerage member assignment with valid invitation" ON public.brokerage_members;
DROP POLICY IF EXISTS "Brokerage owners can manage their brokerage members" ON public.brokerage_members;
DROP POLICY IF EXISTS "Superadmins can manage all brokerage members" ON public.brokerage_members;
DROP POLICY IF EXISTS "Users can view brokerage members with safe access check" ON public.brokerage_members;

-- Drop all policies from invitations
DROP POLICY IF EXISTS "Allow anonymous token validation" ON public.invitations;
DROP POLICY IF EXISTS "invitations_broker_assistant_all" ON public.invitations;
DROP POLICY IF EXISTS "invitations_brokerage_owner_all" ON public.invitations;
DROP POLICY IF EXISTS "invitations_superadmin_all" ON public.invitations;
DROP POLICY IF EXISTS "system_can_update_invitation_status" ON public.invitations;
DROP POLICY IF EXISTS "users_can_view_invitations_sent_to_them" ON public.invitations;
DROP POLICY IF EXISTS "users_can_view_invitations_they_sent" ON public.invitations;

-- Drop all policies from project_members
DROP POLICY IF EXISTS "project_members_broker_assistant_select" ON public.project_members;
DROP POLICY IF EXISTS "project_members_brokerage_owner_all" ON public.project_members;
DROP POLICY IF EXISTS "project_members_brokerage_owner_select" ON public.project_members;
DROP POLICY IF EXISTS "project_members_invitation_insert" ON public.project_members;
DROP POLICY IF EXISTS "project_members_own_membership_select" ON public.project_members;
DROP POLICY IF EXISTS "project_members_superadmin_all" ON public.project_members;

-- Drop all policies from projects
DROP POLICY IF EXISTS "Broker assistants can view brokerage projects" ON public.projects;
DROP POLICY IF EXISTS "Brokerage owners can create projects" ON public.projects;
DROP POLICY IF EXISTS "Brokerage owners can manage their projects" ON public.projects;
DROP POLICY IF EXISTS "Project creators and brokerage owners can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Project creators and brokerage owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project creators can manage their projects" ON public.projects;
DROP POLICY IF EXISTS "Project members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Superadmins can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view accessible projects" ON public.projects;
DROP POLICY IF EXISTS "brokerage_owners_can_insert" ON public.projects;
DROP POLICY IF EXISTS "project_members_can_view" ON public.projects;

-- Drop all policies from project_debt_items
DROP POLICY IF EXISTS "Users can delete project debt items for accessible projects" ON public.project_debt_items;
DROP POLICY IF EXISTS "Users can insert project debt items for accessible projects" ON public.project_debt_items;
DROP POLICY IF EXISTS "Users can update project debt items for accessible projects" ON public.project_debt_items;
DROP POLICY IF EXISTS "Users can view project debt items they have access to" ON public.project_debt_items;

-- Drop all policies from project_secondary_income_items
DROP POLICY IF EXISTS "Users can delete project secondary income items for accessible" ON public.project_secondary_income_items;
DROP POLICY IF EXISTS "Users can insert project secondary income items for accessible" ON public.project_secondary_income_items;
DROP POLICY IF EXISTS "Users can update project secondary income items for accessible" ON public.project_secondary_income_items;
DROP POLICY IF EXISTS "Users can view project secondary income items they have access" ON public.project_secondary_income_items;

-- Drop all policies from simulation_members
DROP POLICY IF EXISTS "Allow simulation member assignment with valid invitation" ON public.simulation_members;
DROP POLICY IF EXISTS "Brokerage owners can manage simulation members" ON public.simulation_members;
DROP POLICY IF EXISTS "Simulation creators can manage members" ON public.simulation_members;
DROP POLICY IF EXISTS "Superadmins can manage all simulation members" ON public.simulation_members;
DROP POLICY IF EXISTS "Users can view simulation members for their simulations" ON public.simulation_members;

-- Drop all policies from simulations
DROP POLICY IF EXISTS "Brokerage owners can manage their simulations" ON public.simulations;
DROP POLICY IF EXISTS "Simulation creators can manage their simulations" ON public.simulations;
DROP POLICY IF EXISTS "Simulation members can view simulations" ON public.simulations;
DROP POLICY IF EXISTS "Superadmins can manage all simulations" ON public.simulations;

-- Drop all policies from form_generation_rules
DROP POLICY IF EXISTS "Users can view form generation rules" ON public.form_generation_rules;

-- Drop all policies from form_links
DROP POLICY IF EXISTS "Superadmins can manage all form links" ON public.form_links;

-- Drop all policies from webhook_logs
DROP POLICY IF EXISTS "Superadmins can manage all webhook logs" ON public.webhook_logs;