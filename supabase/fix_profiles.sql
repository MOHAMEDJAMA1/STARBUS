-- FIX MISSING PROFILES
-- Run this script to create profile entries for any users that exist in Auth but not in public.profiles

INSERT INTO public.profiles (id, email, role, branch_id, full_name)
SELECT 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'role', 'branch_worker'),
  (raw_user_meta_data->>'branch_id')::uuid,
  raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Verify the fix
SELECT count(*) as "Profiles Created" FROM public.profiles;
