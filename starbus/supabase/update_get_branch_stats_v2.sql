-- Update get_branch_stats to support Date Filtering
create or replace function get_branch_stats(target_branch_id uuid default null, query_date date default null)
returns json
language plpgsql
security definer
as $$
declare
  total_received bigint;
  total_taken bigint;
  total_not_taken bigint;
begin
  -- 1. Total Received
  -- If query_date is set, match created_at date.
  select count(*)
  into total_received
  from public.shipments
  where (target_branch_id is null or destination_branch_id = target_branch_id)
  and (query_date is null or created_at::date = query_date);

  -- 2. Total Taken (Delivered)
  -- If query_date is set, match delivered_at date.
  select count(*)
  into total_taken
  from public.shipments
  where (target_branch_id is null or destination_branch_id = target_branch_id)
  and status = 'delivered'
  and (query_date is null or delivered_at::date = query_date);

  -- 3. Total Not Taken (Pending)
  -- "Pending" is a state, not a flow.
  -- If query_date is passed (meaning we are looking at specific day activity), 
  -- we only care about Inflow (Received) and Outflow (Taken).
  -- "Pending" relative to a past date is complex.
  -- Strategy:
  --   If Date is NULL (All Time): Show current pending count.
  --   If Date is SET: Show items from THAT DAY'S batch that are still pending.
  select count(*)
  into total_not_taken
  from public.shipments
  where (target_branch_id is null or destination_branch_id = target_branch_id)
  and status != 'delivered'
  and (query_date is null or created_at::date = query_date);

  return json_build_object(
    'received', total_received,
    'taken', total_taken,
    'not_taken', total_not_taken
  );
end;
$$;
