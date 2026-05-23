-- FIX get_branch_stats v3: Count both incoming and outgoing for ALL stats
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
  -- Total Received: Anything handled by this branch (Sent OR Received)
  SELECT COUNT(*) INTO total_received
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR origin_branch_id = target_branch_id OR destination_branch_id = target_branch_id)
  AND (query_date IS NULL OR created_at::date = query_date);

  -- Total Taken: Anything handled by this branch that has been delivered
  SELECT COUNT(*) INTO total_taken
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR origin_branch_id = target_branch_id OR destination_branch_id = target_branch_id)
  AND status = 'delivered'
  AND (query_date IS NULL OR delivered_at::date = query_date);

  -- Total Not Taken: Anything handled by this branch that is still pending or received
  SELECT COUNT(*) INTO total_not_taken
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR origin_branch_id = target_branch_id OR destination_branch_id = target_branch_id)
  AND status != 'delivered'
  AND status != 'cancelled'
  AND (query_date IS NULL OR created_at::date = query_date);

  RETURN json_build_object(
    'received', total_received,
    'taken', total_taken,
    'not_taken', total_not_taken
  );
END;
$$;
