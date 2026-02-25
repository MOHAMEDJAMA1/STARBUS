-- FIX: Allow all staff and admins to update any shipment status to 'delivered'
-- This ensures that the "Mark as Taken" action works regardless of branch matching issues.

DROP POLICY IF EXISTS "shipments_update_worker" ON public.shipments;

CREATE POLICY "shipments_update_universal" ON public.shipments
    FOR UPDATE USING (
        -- Authenticated workers and admins can update
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'branch_worker' OR role = 'super_admin')
        )
    );

-- Also ensure they can see what they are updating
DROP POLICY IF EXISTS "shipments_select_policy" ON public.shipments;

CREATE POLICY "shipments_select_universal" ON public.shipments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'branch_worker' OR role = 'super_admin')
        )
    );
