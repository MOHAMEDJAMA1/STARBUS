-- STARBUS TOTAL DELIVERY FIX
-- This script ensures all columns and permissions are correctly set for "Mark as Taken"

-- 1. Ensure the delivered_at column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'shipments'
        AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE public.shipments ADD COLUMN delivered_at timestamp with time zone;
    END IF;
END $$;

-- 2. Clean up ALL previous shipment update policies to avoid clashes
DROP POLICY IF EXISTS "Workers can update shipments at their branch" ON public.shipments;
DROP POLICY IF EXISTS "shipments_update_worker" ON public.shipments;
DROP POLICY IF EXISTS "shipments_update_universal" ON public.shipments;

-- 3. Create the STRICT update policy (Isolation)
CREATE POLICY "shipments_update_strict" ON public.shipments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (
                role = 'super_admin' 
                OR branch_id = shipments.destination_branch_id
                OR branch_id = shipments.origin_branch_id
            )
        )
    );

-- 4. Clean up and create the STRICT select policy (Isolation)
DROP POLICY IF EXISTS "shipments_select_policy" ON public.shipments;
DROP POLICY IF EXISTS "shipments_select_universal" ON public.shipments;

CREATE POLICY "shipments_select_strict" ON public.shipments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (
                role = 'super_admin' 
                OR branch_id = shipments.destination_branch_id
                OR branch_id = shipments.origin_branch_id
            )
        )
    );

-- 5. Strict INSERT Policy (Workers can only insert if origin matches their branch)
DROP POLICY IF EXISTS "Workers can insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "shipments_insert_policy" ON public.shipments;
DROP POLICY IF EXISTS "shipments_insert_universal" ON public.shipments;

CREATE POLICY "shipments_insert_strict" ON public.shipments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (
                role = 'super_admin' 
                OR branch_id = shipments.origin_branch_id
            )
        )
    );

-- 6. Final check: grant permissions to authenticated users
GRANT ALL ON TABLE public.shipments TO authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;
