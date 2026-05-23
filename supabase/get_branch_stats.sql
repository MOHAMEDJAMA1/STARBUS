-- Create a function to calculate branch statistics
create or replace function get_branch_stats(target_branch_id uuid default null)
returns json
language plpgsql
security definer
as $$
declare
  total_received bigint;
  total_taken bigint;
  total_not_taken bigint;
begin
  -- Calculate Total Received (All shipments destined for this branch)
  select count(*)
  into total_received
  from public.shipments
  where (target_branch_id is null or destination_branch_id = target_branch_id);

  -- Calculate Total Taken (Delivered)
  select count(*)
  into total_taken
  from public.shipments
  where (target_branch_id is null or destination_branch_id = target_branch_id)
  and status = 'delivered';

  -- Calculate Total Not Taken (Pending/Received but not delivered)
  select count(*)
  into total_not_taken
  from public.shipments
  where (target_branch_id is null or destination_branch_id = target_branch_id)
  and status = 'received'; -- Assumes 'received' means at the destination branch waiting.

  return json_build_object(
    'received', total_received,
    'taken', total_taken,
    'not_taken', total_not_taken
  );
end;
$$;
