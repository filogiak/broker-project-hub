-- Create safe simulation deletion function with proper authorization and cascading
CREATE OR REPLACE FUNCTION public.safe_delete_simulation(p_simulation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  simulation_record RECORD;
  deleted_members_count INTEGER := 0;
  deleted_invitations_count INTEGER := 0;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;

  -- Get simulation details for authorization check
  SELECT * INTO simulation_record
  FROM public.simulations
  WHERE id = p_simulation_id;
  
  IF simulation_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Simulation not found'
    );
  END IF;

  -- Check authorization: brokerage owner, superadmin, or broker assistant
  IF NOT (
    public.user_owns_brokerage(simulation_record.brokerage_id, current_user_id) OR 
    public.user_is_superadmin(current_user_id) OR
    public.user_is_broker_assistant_for_brokerage(simulation_record.brokerage_id, current_user_id)
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authorized to delete this simulation'
    );
  END IF;

  -- Count items before deletion for response
  SELECT COUNT(*) INTO deleted_members_count
  FROM public.simulation_members
  WHERE simulation_id = p_simulation_id;
  
  SELECT COUNT(*) INTO deleted_invitations_count
  FROM public.invitations
  WHERE simulation_id = p_simulation_id;

  -- Begin cascading deletion
  BEGIN
    -- Delete simulation members
    DELETE FROM public.simulation_members
    WHERE simulation_id = p_simulation_id;
    
    -- Delete pending invitations
    DELETE FROM public.invitations
    WHERE simulation_id = p_simulation_id;
    
    -- Delete the simulation itself
    DELETE FROM public.simulations
    WHERE id = p_simulation_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Simulation deleted successfully',
      'deleted_members', deleted_members_count,
      'deleted_invitations', deleted_invitations_count,
      'simulation_name', simulation_record.name
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to delete simulation: ' || SQLERRM
    );
  END;
END;
$$;