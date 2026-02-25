-- UPDATE SUPER ADMIN CREDENTIALS
-- New Email: starbus2026@gmail.com
-- New Password: star2026

DO $$
DECLARE
    admin_id uuid;
BEGIN
    -- 1. Find the Super Admin UUID from public.profiles
    SELECT id INTO admin_id FROM public.profiles WHERE role = 'super_admin' LIMIT 1;

    IF admin_id IS NOT NULL THEN
        -- 2. Update auth.users (Email, Password, and Confirmation)
        UPDATE auth.users SET 
            email = 'starbus2026@gmail.com',
            encrypted_password = crypt('star2026', gen_salt('bf')),
            email_confirmed_at = now(),
            updated_at = now()
        WHERE id = admin_id;

        -- 3. Update public.profiles (Email)
        UPDATE public.profiles SET 
            email = 'starbus2026@gmail.com',
            updated_at = now()
        WHERE id = admin_id;

        RAISE NOTICE 'Admin credentials updated successfully for ID: %', admin_id;
    ELSE
        RAISE EXCEPTION 'No Super Admin found in public.profiles table.';
    END IF;
END $$;
