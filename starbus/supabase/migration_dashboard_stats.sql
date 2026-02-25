-- 1. Performance Indexes for Shipments Table
create index if not exists idx_shipments_destination on public.shipments(destination_branch_id);
create index if not exists idx_shipments_origin on public.shipments(origin_branch_id);
create index if not exists idx_shipments_status on public.shipments(status);
create index if not exists idx_shipments_created_at on public.shipments(created_at);

-- 2. Update System Stats Function (Admin Global)
-- Returns: total_received (all), total_taken (delivered), total_not_taken (undelivered/pending)
create or replace function get_system_stats()
returns json
language plpgsql
security definer
as $$
declare
  c_total int;
  c_taken int;
  c_not_taken int;
  c_branches int;
begin
  -- Security Check: Only Super Admin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin') then
    raise exception 'Access denied';
  end if;

  -- 1. Total Products Received (All shipments ever created/received into system)
  select count(*) into c_total from public.shipments;

  -- 2. Total Taken (Delivered)
  select count(*) into c_taken from public.shipments where status = 'delivered';

  -- 3. Total NOT Taken (Pending/In-Transit/Received but not picked up)
  select count(*) into c_not_taken from public.shipments where status != 'delivered';

  -- 4. Active Branches
  select count(*) into c_branches from public.branches;

  return json_build_object(
    'total_received', c_total,
    'total_taken', c_taken,
    'total_not_taken', c_not_taken,
    'active_branches', c_branches
  );
end;
$$;


-- 3. Create Branch Stats Function (Admin Drill Down)
-- Returns stats for ONE specific branch without exposing row data
create or replace function get_branch_stats(target_branch_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  c_received int;
  c_taken int;
  c_not_taken int;
begin
  -- Security Check: Only Super Admin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin') then
    raise exception 'Access denied';
  end if;

  -- 1. Received AT this branch (Destination)
  -- Or should this include Origin? 
  -- Typically "Inventory" means items DESTINED for this branch.
  select count(*) into c_received 
  from public.shipments 
  where destination_branch_id = target_branch_id;
  
  -- 2. Taken (Delivered from this branch)
  select count(*) into c_taken 
  from public.shipments 
  where destination_branch_id = target_branch_id 
    and status = 'delivered';
  
  -- 3. Not Taken (Pending at this branch)
  select count(*) into c_not_taken 
  from public.shipments 
  where destination_branch_id = target_branch_id 
    and status != 'delivered';

  return json_build_object(
    'branch_id', target_branch_id,
    'received', c_received,
    'taken', c_taken,
    'not_taken', c_not_taken
  );
end;
$$;
