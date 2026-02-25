-- GRANT SUPER ADMIN ACCESS TO ALL SHIPMENTS
-- Previously, RLS policies only allowed workers to see their own branch.
-- This policy grants Super Admins (role = 'super_admin') permission to VIEW ALL rows.

CREATE POLICY "Super Admins can view all shipments"
ON public.shipments
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'super_admin'
  )
);

-- Note: We generally don't want Admins INSERTING shipments manually (workers do that),
-- but if needed, we can add INSERT/UPDATE policies too. 
-- For now, VIEWING is the requirement for the Dashboard.
