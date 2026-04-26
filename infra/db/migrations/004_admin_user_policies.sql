-- ============================================================
-- Admin full access policy for user_profiles
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop the old own-only select policy first (we replace it with a combined one)
DROP POLICY IF EXISTS "up: own select" ON public.user_profiles;

-- New select: own row OR admin can see all
CREATE POLICY "up: select"
  ON public.user_profiles FOR SELECT
  USING (
    auth_subject = auth.uid()::text
    OR public.get_my_role() = 'admin'
  );

-- Admin can update any row (role changes, name edits)
CREATE POLICY "up: admin update all"
  ON public.user_profiles FOR UPDATE
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Admin can delete any row
CREATE POLICY "up: admin delete"
  ON public.user_profiles FOR DELETE
  USING (public.get_my_role() = 'admin');

-- Grant DELETE permission to authenticated role
GRANT DELETE ON public.user_profiles TO authenticated;
