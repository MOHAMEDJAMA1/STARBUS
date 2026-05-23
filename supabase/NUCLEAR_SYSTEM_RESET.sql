-- ⚠️ NUCLEAR SYSTEM RESET ⚠️
-- This script wipes ALL business data and ALL staff accounts.
-- ONLY THE SUPER_ADMIN profile and auth account will remain.

BEGIN;

-- 1. Create a list of users to delete (Everyone except super_admin)
CREATE TEMP TABLE users_to_wipe AS 
SELECT id FROM public.profiles 
WHERE role != 'super_admin' OR role IS NULL;

-- 2. Delete all shipments (The data)
TRUNCATE TABLE public.shipments CASCADE;

-- 3. Clear branch references from profiles before deleting branches
UPDATE public.profiles SET branch_id = NULL;

-- 4. Delete all branches (The locations)
DELETE FROM public.branches;

-- 5. Delete staff profiles
DELETE FROM public.profiles 
WHERE id IN (SELECT id FROM users_to_wipe);

-- 6. Delete staff auth accounts (The logins)
DELETE FROM auth.users 
WHERE id IN (SELECT id FROM users_to_wipe);

-- 7. Cleanup
DROP TABLE users_to_wipe;

COMMIT;

-- VERIFICATION
SELECT 
    (SELECT count(*) FROM public.shipments) as remaining_shipments,
    (SELECT count(*) FROM public.branches) as remaining_branches,
    (SELECT count(*) FROM public.profiles) as remaining_profiles_count,
    (SELECT email FROM public.profiles LIMIT 1) as current_admin_email;
