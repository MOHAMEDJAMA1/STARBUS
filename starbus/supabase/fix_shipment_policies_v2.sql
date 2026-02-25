-- NUCLEAR FIX FOR SHIPMENT POLICIES
-- This script drops ALL existing policies on 'shipments' and re-creates them cleanly.
-- Use this to resolve "Row-Level Security" errors definitively.

-- 1. DROP ALL EXISTING POLICIES (Clean Slate)
DROP POLICY IF EXISTS "Workers view own branch shipments" ON public.shipments;
DROP POLICY IF EXISTS "Workers can insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Workers can update shipments at their branch" ON public.shipments;
DROP POLICY IF EXISTS "Super Admins can view all shipments" ON public.shipments;
DROP POLICY IF EXISTS "Super Admins can update shipments" ON public.shipments;
DROP POLICY IF EXISTS "Super Admins can delete shipments" ON public.shipments;

-- 2. RE-ENABLE RLS (Just in case)
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- 3. WORKER POLICIES

-- VIEW: Workers can see shipments coming FROM or going TO their branch
CREATE POLICY "Workers view own shipments"
ON public.shipments
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE branch_id = shipments.destination_branch_id 
       OR branch_id = shipments.origin_branch_id
  )
);

-- INSERT: Workers can create shipments originating FROM their branch
CREATE POLICY "Workers create shipments"
ON public.shipments
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE branch_id = shipments.origin_branch_id
  )
);

-- UPDATE: Workers can update shipments at their DESTINATION branch (e.g. Mark as Taken)
CREATE POLICY "Workers update destination shipments"
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

-- 4. SUPER ADMIN POLICIES

-- ALL ACCESS: Super Admins can do everything
CREATE POLICY "Admins full access"
ON public.shipments
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'super_admin'
  )
);
