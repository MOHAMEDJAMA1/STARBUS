-- FIX get_branch_stats: Count both incoming and outgoing for the branch
CREATE OR REPLACE FUNCTION get_branch_stats(target_branch_id uuid DEFAULT NULL, query_date date DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_received bigint;
  total_taken bigint;
  total_not_taken bigint;
BEGIN
  -- Received = Created at this branch (Outgoing) OR Destined for this branch (Incoming)
  SELECT COUNT(*) INTO total_received
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR origin_branch_id = target_branch_id OR destination_branch_id = target_branch_id)
  AND (query_date IS NULL OR created_at::date = query_date);

  -- Taken = Delivered at destination branch
  SELECT COUNT(*) INTO total_taken
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR destination_branch_id = target_branch_id)
  AND status = 'delivered'
  AND (query_date IS NULL OR delivered_at::date = query_date);

  -- Not Taken = Destined for this branch but not yet delivered
  SELECT COUNT(*) INTO total_not_taken
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR destination_branch_id = target_branch_id)
  AND status != 'delivered'
  AND (query_date IS NULL OR created_at::date = query_date);

  RETURN json_build_object(
    'received', total_received,
    'taken', total_taken,
    'not_taken', total_not_taken
  );
END;
$$;
