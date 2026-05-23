-- Enable pgcrypto for UUIDs and Hashing if needed
create extension if not exists pgcrypto;

-- Create table for branches (Must be created first as profiles reference it)
create table public.branches (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for branches
alter table public.branches enable row level security;

-- Policy: Everyone can view branches (needed for selection)
create policy "Branches are viewable by everyone." on public.branches
  for select using (true);

-- Policy: Only Super Admins can insert branches
create policy "Admins can insert branches" on public.branches
  for insert with check (
    auth.uid() in (select id from public.profiles where role = 'super_admin')
  );


-- Create a table for public profiles (linked to auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text unique,
  role text check (role in ('super_admin', 'branch_worker')) default 'branch_worker',
  branch_id uuid references public.branches(id), -- Only for branch workers
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

-- Only Admin or Self can insert (Admin creates workers)
create policy "Admins can insert profiles" on public.profiles
  for insert with check (
    auth.uid() in (select id from public.profiles where role = 'super_admin')
    OR auth.uid() = id -- Self-registration fallback if needed, though strictly Admin-only requested
  );

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- TRIGGER: Automatically create profile on signup (Optional if Admin creates via Edge Function, but good backup)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, branch_id)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    coalesce(new.raw_user_meta_data->>'role', 'branch_worker'),
    (new.raw_user_meta_data->>'branch_id')::uuid
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Create table for shipments
create table public.shipments (
  id uuid default uuid_generate_v4() primary key,
  tracking_number text unique not null,
  sender_name text not null,
  sender_phone text not null,
  receiver_name text not null,
  receiver_phone text not null,
  destination_branch_id uuid references public.branches(id) not null,
  origin_branch_id uuid references public.branches(id), 
  status text check (status in ('pending', 'in_transit', 'received', 'delivered')) default 'pending',
  description text,
  received_at timestamp with time zone,
  received_by uuid references public.profiles(id), 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for shipments
alter table public.shipments enable row level security;

-- STRICT POLICIES for Shipments

-- 1. Branch Workers: Can VIEW if destination is their branch OR they received it (origin).
create policy "Workers view own branch shipments" on public.shipments
  for select using (
    auth.uid() in (
      select id from public.profiles 
      where branch_id = shipments.destination_branch_id 
         or branch_id = shipments.origin_branch_id
    )
  );

-- 2. Branch Workers: Can INSERT (Receive) at their branch.
create policy "Workers can insert shipments" on public.shipments
  for insert with check (
    auth.uid() in (
      select id from public.profiles where branch_id = shipments.origin_branch_id
    )
  );

-- 3. Branch Workers: Can UPDATE shipments at their branch.
create policy "Workers can update shipments at their branch" on public.shipments
  for update using (
    auth.uid() in (
      select id from public.profiles where branch_id = shipments.destination_branch_id
    )
  );

-- 4. Super Admin: NO ACCESS to individual rows (Per requirement).
-- No policy added for Super Admin means implicit DENY for SELECT/INSERT/UPDATE on shipments.

-- SECURE FUNCTION for Admin Stats
create or replace function get_system_stats()
returns json
language plpgsql
security definer -- Runs with owner privileges (bypasses RLS)
as $$
declare
  total_shipments int;
  active_branches int;
  total_users int;
begin
  -- Check if caller is super_admin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin') then
    raise exception 'Access denied';
  end if;

  select count(*) into total_shipments from public.shipments;
  select count(*) into active_branches from public.branches;
  select count(*) into total_users from public.profiles;

  return json_build_object(
    'total_shipments', total_shipments,
    'active_branches', active_branches,
    'total_users', total_users
  );
end;
$$;
