-- Clean up any broken/failed attempts
delete from public.profiles where email = 'superadmin@starbus.com';
delete from auth.users where email = 'superadmin@starbus.com';
