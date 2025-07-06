-- Phase 1: Database Cleanup Function
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_user_roles()
RETURNS TABLE(
  user_email text,
  removed_roles user_role[],
  kept_roles user_role[]
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  user_roles_array user_role[];
  orphaned_roles user_role[];
  kept_roles_array user_role[];
  has_brokerage_membership boolean;
  has_project_membership boolean;
  has_simulation_membership boolean;
BEGIN
  -- Loop through all users with roles
  FOR user_record IN 
    SELECT DISTINCT ur.user_id, p.email
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
  LOOP
    -- Get all roles for this user
    SELECT ARRAY_AGG(role) INTO user_roles_array
    FROM public.user_roles
    WHERE user_id = user_record.user_id;
    
    -- Check if user has any active memberships
    SELECT EXISTS(
      SELECT 1 FROM public.brokerage_members 
      WHERE user_id = user_record.user_id
    ) INTO has_brokerage_membership;
    
    SELECT EXISTS(
      SELECT 1 FROM public.project_members 
      WHERE user_id = user_record.user_id
    ) INTO has_project_membership;
    
    SELECT EXISTS(
      SELECT 1 FROM public.simulation_members 
      WHERE user_id = user_record.user_id
    ) INTO has_simulation_membership;
    
    -- Initialize arrays
    orphaned_roles := ARRAY[]::user_role[];
    kept_roles_array := ARRAY[]::user_role[];
    
    -- Process each role
    FOR i IN 1..array_length(user_roles_array, 1) LOOP
      CASE user_roles_array[i]
        -- Always keep superadmin and brokerage_owner (permanent roles)
        WHEN 'superadmin', 'brokerage_owner' THEN
          kept_roles_array := array_append(kept_roles_array, user_roles_array[i]);
        -- Keep other roles only if user has relevant memberships
        WHEN 'simulation_collaborator' THEN
          IF has_brokerage_membership OR has_simulation_membership THEN
            kept_roles_array := array_append(kept_roles_array, user_roles_array[i]);
          ELSE
            orphaned_roles := array_append(orphaned_roles, user_roles_array[i]);
          END IF;
        WHEN 'broker_assistant', 'real_estate_agent' THEN
          IF has_brokerage_membership OR has_project_membership THEN
            kept_roles_array := array_append(kept_roles_array, user_roles_array[i]);
          ELSE
            orphaned_roles := array_append(orphaned_roles, user_roles_array[i]);
          END IF;
        WHEN 'mortgage_applicant' THEN
          IF has_project_membership THEN
            kept_roles_array := array_append(kept_roles_array, user_roles_array[i]);
          ELSE
            orphaned_roles := array_append(orphaned_roles, user_roles_array[i]);
          END IF;
        ELSE
          -- Unknown role, keep it to be safe
          kept_roles_array := array_append(kept_roles_array, user_roles_array[i]);
      END CASE;
    END LOOP;
    
    -- Remove orphaned roles if any found
    IF array_length(orphaned_roles, 1) > 0 THEN
      DELETE FROM public.user_roles 
      WHERE user_id = user_record.user_id 
        AND role = ANY(orphaned_roles);
        
      -- Return result for this user
      user_email := user_record.email;
      removed_roles := orphaned_roles;
      kept_roles := kept_roles_array;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Phase 2: Prevention Triggers
-- Function to clean up user roles when memberships are removed
CREATE OR REPLACE FUNCTION public.cleanup_user_roles_on_membership_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  has_any_brokerage_membership boolean := false;
  has_any_project_membership boolean := false;
  has_any_simulation_membership boolean := false;
BEGIN
  -- Get user_id from the operation
  target_user_id := COALESCE(OLD.user_id, NEW.user_id);
  
  -- Check remaining memberships for this user
  SELECT EXISTS(
    SELECT 1 FROM public.brokerage_members 
    WHERE user_id = target_user_id
  ) INTO has_any_brokerage_membership;
  
  SELECT EXISTS(
    SELECT 1 FROM public.project_members 
    WHERE user_id = target_user_id
  ) INTO has_any_project_membership;
  
  SELECT EXISTS(
    SELECT 1 FROM public.simulation_members 
    WHERE user_id = target_user_id
  ) INTO has_any_simulation_membership;
  
  -- Clean up roles based on remaining memberships
  -- Remove simulation_collaborator if no brokerage or simulation memberships
  IF NOT has_any_brokerage_membership AND NOT has_any_simulation_membership THEN
    DELETE FROM public.user_roles 
    WHERE user_id = target_user_id 
      AND role = 'simulation_collaborator';
  END IF;
  
  -- Remove broker_assistant/real_estate_agent if no brokerage or project memberships
  IF NOT has_any_brokerage_membership AND NOT has_any_project_membership THEN
    DELETE FROM public.user_roles 
    WHERE user_id = target_user_id 
      AND role IN ('broker_assistant', 'real_estate_agent');
  END IF;
  
  -- Remove mortgage_applicant if no project memberships
  IF NOT has_any_project_membership THEN
    DELETE FROM public.user_roles 
    WHERE user_id = target_user_id 
      AND role = 'mortgage_applicant';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers on membership tables
CREATE OR REPLACE TRIGGER cleanup_roles_on_brokerage_member_change
  AFTER DELETE OR UPDATE ON public.brokerage_members
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_user_roles_on_membership_change();

CREATE OR REPLACE TRIGGER cleanup_roles_on_project_member_change
  AFTER DELETE OR UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_user_roles_on_membership_change();

CREATE OR REPLACE TRIGGER cleanup_roles_on_simulation_member_change
  AFTER DELETE OR UPDATE ON public.simulation_members
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_user_roles_on_membership_change();

-- Execute the cleanup
SELECT * FROM public.cleanup_orphaned_user_roles();