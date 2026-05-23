-- FIX ALL PERMISSIONS FOR SUPER ADMIN
-- Run this entire script in the Supabase SQL Editor

-- ============================================================
-- 1. FIX BRANCHES TABLE: Allow super_admin to do everything
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert branches" ON public.branches;
DROP POLICY IF EXISTS "Branches are viewable by everyone." ON public.branches;
DROP POLICY IF EXISTS "Admins can update branches" ON public.branches;
DROP POLICY IF EXISTS "Admins can delete branches" ON public.branches;

-- Allow everyone to view branches (needed for dropdowns)
CREATE POLICY "branches_select_all" ON public.branches
    FOR SELECT USING (true);

-- Allow super_admin to create branches
CREATE POLICY "branches_insert_admin" ON public.branches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Allow super_admin to update branches
CREATE POLICY "branches_update_admin" ON public.branches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Allow super_admin to delete branches
CREATE POLICY "branches_delete_admin" ON public.branches
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================
-- 2. FIX PROFILES TABLE: Allow super_admin to manage all
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Everyone can view profiles (for admin lists etc.)
CREATE POLICY "profiles_select_all" ON public.profiles
    FOR SELECT USING (true);

-- Super admin can insert profiles (workers)
CREATE POLICY "profiles_insert_admin" ON public.profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
        OR auth.uid() = id  -- Allow self-registration via trigger
    );

-- Users can update their own profile, admin can update all
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Super admin can delete profiles
CREATE POLICY "profiles_delete_admin" ON public.profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================
-- 3. FIX SHIPMENTS TABLE: Super admin can view all
-- ============================================================
DROP POLICY IF EXISTS "Super admin can view all shipments" ON public.shipments;

CREATE POLICY "shipments_select_admin" ON public.shipments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
        OR auth.uid() IN (
            SELECT id FROM public.profiles
            WHERE branch_id = shipments.destination_branch_id
               OR branch_id = shipments.origin_branch_id
        )
    );

-- ============================================================
-- 4. FIX get_branch_stats: Remove super_admin check so it works
-- ============================================================
CREATE OR REPLACE FUNCTION get_branch_stats(target_branch_id uuid DEFAULT NULL, query_date date DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_received bigint;
  total_taken bigint;
  total_not_taken bigint;
BEGIN
  SELECT COUNT(*) INTO total_received
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR destination_branch_id = target_branch_id)
  AND (query_date IS NULL OR created_at::date = query_date);

  SELECT COUNT(*) INTO total_taken
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR destination_branch_id = target_branch_id)
  AND status = 'delivered'
  AND (query_date IS NULL OR delivered_at::date = query_date);

  SELECT COUNT(*) INTO total_not_taken
  FROM public.shipments
  WHERE (target_branch_id IS NULL OR destination_branch_id = target_branch_id)
  AND status != 'delivered'
  AND (query_date IS NULL OR created_at::date = query_date);

  RETURN json_build_object(
    'received', total_received,
    'taken', total_taken,
    'not_taken', total_not_taken
  );
END;
$$;
