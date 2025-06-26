
-- Fix the handle_new_user function to prevent blocking auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Wrap profile creation in exception handling to prevent blocking auth signup
  BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name'
    );
    
    -- Log successful profile creation
    RAISE NOTICE 'Profile created successfully for user %', NEW.email;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't throw it to prevent blocking auth signup
    RAISE WARNING 'Failed to create profile for user %: % %', NEW.email, SQLERRM, SQLSTATE;
    -- Continue execution - don't block the auth user creation
  END;
  
  RETURN NEW;
END;
$$;
