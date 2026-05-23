-- ⚠️ FINAL CLEAN WIPE SCRIPT ⚠️
-- This handles the "Foreign Key Constraint" error by deleting in the exact correct order.

-- 1. Create a temporary list of workers to delete
-- We capture them now because once we delete profiles, we lose the 'role' info.
CREATE TEMP TABLE workers_to_delete AS 
SELECT id FROM public.profiles 
WHERE role = 'branch_worker' OR role IS NULL;

-- 2. Delete Shipments & Clear Branch References
-- This clears dependencies so we can delete branches and profiles.
TRUNCATE TABLE public.shipments CASCADE;
UPDATE public.profiles SET branch_id = NULL;

-- 3. Delete Profiles FIRST (The Child)
-- This removes the constraint that was blocking `auth.users` deletion.
DELETE FROM public.profiles 
WHERE id IN (SELECT id FROM workers_to_delete);

-- 4. Delete Users (The Parent)
-- Now that profiles are gone, we can safely delete the login accounts.
DELETE FROM auth.users 
WHERE id IN (SELECT id FROM workers_to_delete);

-- 5. Delete Branches
DELETE FROM public.branches;

-- 6. Cleanup
DROP TABLE workers_to_delete;

-- 7. Verification Output
SELECT 'Wipe Complete. Shipments: ' || (SELECT count(*) FROM public.shipments) || 
       ', Branches: ' || (SELECT count(*) FROM public.branches) || 
       ', Profiles: ' || (SELECT count(*) FROM public.profiles) as status;
