-- Need pgcrypto for password hashing
create extension if not exists pgcrypto;

-- 1. Create the User in auth.users
-- Password "super123" hashed with bcrypt
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000001', -- Fixed UUID for easy reference
  'superadmin@starbus.com',
  crypt('super123', gen_salt('bf')), -- Generates valid bcrypt hash
  now(), -- Confirmed immediately
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Super Admin"}',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING; -- Avoid error if run twice

-- 2. Create the Profile in public.profiles
insert into public.profiles (id, email, role, full_name)
values (
  '00000000-0000-0000-0000-000000000001',
  'superadmin@starbus.com',
  'super_admin',
  'Super Admin'
) ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin'; -- Ensure role is correct even if user existed
