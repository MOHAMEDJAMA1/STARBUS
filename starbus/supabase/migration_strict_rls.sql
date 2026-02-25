-- 1. DROP EXISTING POLICIES (To ensure clean state)
drop policy if exists "Shipments viewable by logged in users" on public.shipments;
drop policy if exists "Workers can update shipments at their branch" on public.shipments;
drop policy if exists "Workers view own branch shipments" on public.shipments;
drop policy if exists "Workers can insert shipments" on public.shipments;

-- 2. CREATE STRICT POLICIES FOR SHIPMENTS

-- A. Branch Workers: Can VIEW if destination is their branch OR they received it (origin).
create policy "Workers view own branch shipments" on public.shipments
  for select using (
    auth.uid() in (
      select id from public.profiles 
      where branch_id = shipments.destination_branch_id 
         or branch_id = shipments.origin_branch_id
    )
  );

-- B. Branch Workers: Can INSERT (Receive) at their branch.
create policy "Workers can insert shipments" on public.shipments
  for insert with check (
    auth.uid() in (
      select id from public.profiles where branch_id = shipments.origin_branch_id
    )
  );

-- C. Branch Workers: Can UPDATE shipments at their branch.
create policy "Workers can update shipments at their branch" on public.shipments
  for update using (
    auth.uid() in (
      select id from public.profiles where branch_id = shipments.destination_branch_id
    )
  );

-- D. Super Admin: NO ACCESS to individual rows (Implicit Deny). 
-- We do NOT create a policy for Super Admin, so they get 0 rows when selecting from public.shipments.


-- 3. CREATE SECURE FUNCTION FOR ADMIN STATS
-- This function runs with "security definer" to bypass RLS and count all rows
create or replace function get_system_stats()
returns json
language plpgsql
security definer 
as $$
declare
  total_shipments int;
  active_branches int;
  total_users int;
begin
  -- Check if caller is super_admin (Optional extra security)
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


-- 4. UPDATE USER TRIGGER (To handle branch_id from metadata)
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
