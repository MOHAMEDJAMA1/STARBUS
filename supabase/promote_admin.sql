-- 1. Confirm the email (so you can login)
update auth.users
set email_confirmed_at = now()
where email = 'superadmin@starbus.com';

-- 2. Ensure they have the Super Admin role
update public.profiles
set role = 'super_admin'
where email = 'superadmin@starbus.com';
