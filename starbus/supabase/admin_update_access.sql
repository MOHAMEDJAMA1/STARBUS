-- GRANT SUPER ADMIN UPDATE/DELETE ACCESS TO SHIPMENTS
-- Needed so Admins can "Mark as Taken" or manage shipments from the dashboard

CREATE POLICY "Super Admins can update shipments"
ON public.shipments
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'super_admin'
  )
);

CREATE POLICY "Super Admins can delete shipments"
ON public.shipments
FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'super_admin'
  )
);
