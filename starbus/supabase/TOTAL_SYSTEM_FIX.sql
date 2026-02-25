-- STARBUS TOTAL SYSTEM FIX (FORCE VERSION)
-- This script wipes and recreates all critical logic to ensure 100% correctness.

-- 1. Ensure columns exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'delivered_at') THEN
        ALTER TABLE public.shipments ADD COLUMN delivered_at timestamp with time zone;
    END IF;
END $$;

-- 2. UNIVERSAL RLS WIPE
-- Drop ALL possible variants of policies to start from a clean slate
DROP POLICY IF EXISTS "Workers view own branch shipments" ON public.shipments;
DROP POLICY IF EXISTS "Workers can insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Workers can update shipments at their branch" ON public.shipments;
DROP POLICY IF EXISTS "shipments_select_policy" ON public.shipments;
DROP POLICY IF EXISTS "shipments_update_worker" ON public.shipments;
DROP POLICY IF EXISTS "shipments_update_universal" ON public.shipments;
DROP POLICY IF EXISTS "shipments_select_universal" ON public.shipments;
DROP POLICY IF EXISTS "shipments_insert_universal" ON public.shipments;
DROP POLICY IF EXISTS "shipments_select_strict" ON public.shipments;
DROP POLICY IF EXISTS "shipments_update_strict" ON public.shipments;
DROP POLICY IF EXISTS "shipments_insert_strict" ON public.shipments;

-- 3. APPLY FINAL STRICT POLICIES
-- SELECT: Only own branch data or Admin
CREATE POLICY "shipments_select_final" ON public.shipments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'super_admin' OR branch_id = shipments.origin_branch_id OR branch_id = shipments.destination_branch_id)
    )
);

-- INSERT: Only if origin is your branch or Admin
CREATE POLICY "shipments_insert_final" ON public.shipments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'super_admin' OR branch_id = shipments.origin_branch_id)
    )
);

-- UPDATE: Only if origin/destination is your branch or Admin
CREATE POLICY "shipments_update_final" ON public.shipments FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (role = 'super_admin' OR branch_id = shipments.origin_branch_id OR branch_id = shipments.destination_branch_id)
    )
);

-- 4. FIX GET_BRANCH_STATS (No more "fake" global data for workers)
CREATE OR REPLACE FUNCTION get_branch_stats(target_branch_id uuid DEFAULT NULL, query_date date DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_received bigint;
  total_taken bigint;
  total_not_taken bigint;
  is_admin boolean;
BEGIN
  -- Check if caller is super_admin
  SELECT (role = 'super_admin') INTO is_admin FROM public.profiles WHERE id = auth.uid();

  -- Safety: If not admin and target_branch_id is NULL, force it to be 0/nothing (Prevent global leak)
  IF target_branch_id IS NULL AND (is_admin IS NULL OR is_admin = false) THEN
    RETURN json_build_object('received', 0, 'taken', 0, 'not_taken', 0);
  END IF;

  -- 1. Total Received (Shipments created AT this branch = Origin)
  SELECT count(*)
  INTO total_received
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR origin_branch_id = target_branch_id)
  AND (query_date IS NULL OR created_at::date = query_date);

  -- 2. Total Taken (Delivered AT this branch = Destination)
  SELECT count(*)
  INTO total_taken
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR destination_branch_id = target_branch_id)
  AND status = 'delivered'
  AND (query_date IS NULL OR delivered_at::date = query_date);

  -- 3. Total Pending (Ready for pickup AT this branch = Destination)
  SELECT count(*)
  INTO total_not_taken
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR destination_branch_id = target_branch_id)
  AND status = 'received' -- In this app, 'received' means reached system, waiting for pickup/delivery.
  AND (query_date IS NULL OR created_at::date = query_date);

  RETURN json_build_object(
    'received', total_received,
    'taken', total_taken,
    'not_taken', total_not_taken
  );
END;
$$;

-- 5. FINAL PERMISSION GRANTS
GRANT ALL ON TABLE public.shipments TO authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.branches TO authenticated;
