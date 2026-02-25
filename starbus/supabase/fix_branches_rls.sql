-- 1. Drop existing policies on branches to avoid conflicts
drop policy if exists "Branches are viewable by everyone." on public.branches;
drop policy if exists "Admins can insert branches" on public.branches;
drop policy if exists "Admins can update branches" on public.branches;
drop policy if exists "Admins can delete branches" on public.branches;

-- 2. Enable RLS (Ensure it is enabled)
alter table public.branches enable row level security;

-- 3. Re-create Policies

-- A. VIEW: Everyone can view branches (needed for login/signup dropdowns)
create policy "Branches are viewable by everyone" on public.branches
  for select using (true);

-- B. INSERT: Only Super Admins
create policy "Admins can insert branches" on public.branches
  for insert with check (
    -- Check if the user is a super_admin in the profiles table
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'super_admin'
    )
  );

-- C. UPDATE: Only Super Admins
create policy "Admins can update branches" on public.branches
  for update using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'super_admin'
    )
  );

-- D. DELETE: Only Super Admins
create policy "Admins can delete branches" on public.branches
  for delete using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role = 'super_admin'
    )
  );
