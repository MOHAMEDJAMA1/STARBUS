-- Run this AFTER creating the user manually in the Supabase Dashboard
update public.profiles
set role = 'super_admin'
where email = 'superadmin@starbus.com';
