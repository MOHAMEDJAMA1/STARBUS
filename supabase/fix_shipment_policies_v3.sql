-- Fix 1: Allow workers to UPDATE (mark as taken) shipments at THEIR destination branch
DROP POLICY IF EXISTS "Workers can update shipments at their branch" ON public.shipments;

CREATE POLICY "shipments_update_worker" ON public.shipments
    FOR UPDATE USING (
        -- Worker can update if their branch is the DESTINATION
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE branch_id = shipments.destination_branch_id
        )
        -- OR super admin can update anything
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Fix 2: Allow workers to UPDATE status to 'delivered' with delivered_at timestamp
-- (already covered by update policy above, but make sure update is not blocked by check)

-- Fix 3: The get_branch_stats function runs SECURITY DEFINER, meaning it runs as the 
-- postgres role (bypasses RLS). But if the current user doesn't have SELECT on shipments,
-- Supabase might still block it in some contexts.
-- Solution: Grant EXECUTE to authenticated users explicitly.
GRANT EXECUTE ON FUNCTION get_branch_stats(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_branch_stats(uuid, date) TO anon;

-- Fix 4: Make sure super admin can view ALL shipments (for branch details page)
DROP POLICY IF EXISTS "shipments_select_admin" ON public.shipments;
DROP POLICY IF EXISTS "Workers view own branch shipments" ON public.shipments;

CREATE POLICY "shipments_select_policy" ON public.shipments
    FOR SELECT USING (
        -- Super admin sees everything
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
        -- Workers see shipments destined for OR sent from their branch
        OR auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE branch_id = shipments.destination_branch_id
               OR branch_id = shipments.origin_branch_id
        )
    );

-- Fix 5: Allow workers to INSERT shipments (they create new ones)
DROP POLICY IF EXISTS "Workers can insert shipments" ON public.shipments;

CREATE POLICY "shipments_insert_policy" ON public.shipments
    FOR INSERT WITH CHECK (
        -- Worker at origin branch can create shipment
        auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE branch_id = shipments.origin_branch_id
        )
        -- Super admin can insert too
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );
