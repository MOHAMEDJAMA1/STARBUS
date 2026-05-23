-- ENABLE WORKERS TO UPDATE SHIPMENT STATUS
-- This ensures that workers at the destination branch can "Mark as Taken" (Delivered)

-- 1. Drop existing policy if it exists (to avoid duplicates/conflicts)
DROP POLICY IF EXISTS "Workers can update shipments at their branch" ON public.shipments;

-- 2. Create the policy explicitly
CREATE POLICY "Workers can update shipments at their branch"
ON public.shipments
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE branch_id = shipments.destination_branch_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE branch_id = shipments.destination_branch_id
  )
);
