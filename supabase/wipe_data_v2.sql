-- DATA WIPE SCRIPT
-- Deletes all shipments, branches, and profiles (Except Super Admin)

BEGIN;

-- 1. Delete all shipments
DELETE FROM public.shipments;

-- 2. Delete all profiles EXCEPT super_admin
DELETE FROM public.profiles WHERE role <> 'super_admin';

-- 3. Delete all branches (Must be done after profiles because profiles reference branches)
DELETE FROM public.branches;

COMMIT;
