-- Enable encryption
create extension if not exists pgcrypto;

DO $$
DECLARE
  admin_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- 1. Insert into auth.users (Upsert)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_id,
    'authenticated',
    'authenticated',
    'superadmin@starbus.com',
    crypt('super123', gen_salt('bf')), -- Hash password
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Super Admin"}',
    now(),
    now(),
    false -- Internal Supabase superadmin flag (keep false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 'superadmin@starbus.com',
    encrypted_password = crypt('super123', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now();

  -- 2. Insert into public.profiles (Upsert)
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    admin_id,
    'superadmin@starbus.com',
    'super_admin',
    'Super Admin'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    full_name = 'Super Admin';
    
END $$;
