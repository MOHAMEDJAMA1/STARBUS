-- RELAX INSERT POLICY
-- Allows workers to create shipments from ANY origin branch (not just their own).
-- Required because the client wants to be able to select "From City" freely.

DROP POLICY IF EXISTS "Workers create shipments" ON public.shipments;

CREATE POLICY "Workers create shipments"
ON public.shipments
FOR INSERT
WITH CHECK (
  -- Allow any authenticated profile (worker or admin) to insert
  auth.uid() IN (SELECT id FROM public.profiles)
);
