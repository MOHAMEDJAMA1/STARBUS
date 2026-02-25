-- Finds the User ID and inserts the missing profile
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- 1. Get the User ID from auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'superadmin@starbus.com';

  -- 2. If user exists, insert/update profile
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (target_user_id, 'superadmin@starbus.com', 'super_admin', 'Super Admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'super_admin', full_name = 'Super Admin';
    
    RAISE NOTICE 'Profile fixed for User ID: %', target_user_id;
  ELSE
    RAISE NOTICE 'User superadmin@starbus.com not found in auth.users';
  END IF;
END $$;
