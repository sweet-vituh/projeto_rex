-- Enable realtime for requisitions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.requisitions;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
  )
$$;

-- Add RLS policy for admins to view all user_roles
CREATE POLICY "Admins can view all user_roles" 
ON public.user_roles 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Add RLS policy for admins to update user_roles
CREATE POLICY "Admins can update user_roles" 
ON public.user_roles 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Add RLS policy for admins to delete user_roles
CREATE POLICY "Admins can delete user_roles" 
ON public.user_roles 
FOR DELETE 
USING (is_admin(auth.uid()));