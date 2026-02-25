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

-- 3. Create the UNIVERSAL update policy
CREATE POLICY "shipments_update_universal" ON public.shipments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'branch_worker' OR role = 'super_admin')
        )
    );

-- 4. Clean up and create the UNIVERSAL select policy
DROP POLICY IF EXISTS "shipments_select_policy" ON public.shipments;
DROP POLICY IF EXISTS "shipments_select_universal" ON public.shipments;

CREATE POLICY "shipments_select_universal" ON public.shipments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'branch_worker' OR role = 'super_admin')
        )
    );

-- 5. Universal INSERT Policy (All staff can create shipments)
DROP POLICY IF EXISTS "Workers can insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "shipments_insert_policy" ON public.shipments;

CREATE POLICY "shipments_insert_universal" ON public.shipments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'branch_worker' OR role = 'super_admin')
        )
    );

-- 6. Final check: grant permissions to authenticated users
GRANT ALL ON TABLE public.shipments TO authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;
