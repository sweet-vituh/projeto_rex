-- 1. Remove the dangerous INSERT policy that allows any user to assign any role
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user_roles;

-- 2. Add UNIQUE constraint on user_id to ensure one role per user
-- First drop existing constraint if any
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add unique constraint on user_id only
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- 3. Create SECURITY DEFINER function for safe role creation during signup
CREATE OR REPLACE FUNCTION public.create_user_role(_user_id uuid, _username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already has a role
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'User already has a role assigned';
  END IF;
  
  -- Always insert as mechanic - never allow role escalation
  INSERT INTO user_roles (user_id, username, role)
  VALUES (_user_id, _username, 'mechanic');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_role TO authenticated;