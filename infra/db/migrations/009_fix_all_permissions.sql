-- ============================================================
-- 009: Fix admin permissions for officers + user_profiles
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── Drop all existing officer policies (clean slate) ────────
DROP POLICY IF EXISTS "officers: own read" ON public.officers;
DROP POLICY IF EXISTS "officers: own select" ON public.officers;
DROP POLICY IF EXISTS "officers: own update" ON public.officers;
DROP POLICY IF EXISTS "officers: officer role read all" ON public.officers;
DROP POLICY IF EXISTS "officers: staff select all" ON public.officers;
DROP POLICY IF EXISTS "officers: pending own select" ON public.officers;
DROP POLICY IF EXISTS "officers: authenticated insert own" ON public.officers;

-- ─── Recreate officer policies ────────────────────────────────

-- Any authenticated user can read officers (needed for assignment dropdowns, admin users page)
CREATE POLICY "officers: authenticated read"
  ON public.officers FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Officers can update their own row
CREATE POLICY "officers: own update"
  ON public.officers FOR UPDATE
  USING (officer_id = public.get_my_officer_id());

-- Admin can update any officer row (activate/deactivate)
CREATE POLICY "officers: admin update"
  ON public.officers FOR UPDATE
  USING (public.get_my_role() = 'admin');

-- New officer can insert their own row during sign-up
CREATE POLICY "officers: insert on signup"
  ON public.officers FOR INSERT
  WITH CHECK (keycloak_id = auth.uid()::text);

-- Admin can delete officer rows
CREATE POLICY "officers: admin delete"
  ON public.officers FOR DELETE
  USING (public.get_my_role() = 'admin');

-- ─── Ensure grants are correct ────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.officers TO authenticated;

-- ─── Drop all existing user_profiles policies (clean slate) ──
DROP POLICY IF EXISTS "up: own select" ON public.user_profiles;
DROP POLICY IF EXISTS "up: select" ON public.user_profiles;
DROP POLICY IF EXISTS "up: own update" ON public.user_profiles;
DROP POLICY IF EXISTS "up: own insert" ON public.user_profiles;
DROP POLICY IF EXISTS "up: admin read all" ON public.user_profiles;
DROP POLICY IF EXISTS "up: admin update all" ON public.user_profiles;
DROP POLICY IF EXISTS "up: admin delete" ON public.user_profiles;
DROP POLICY IF EXISTS "up: pending own select" ON public.user_profiles;

-- ─── Recreate user_profiles policies ─────────────────────────

-- Any authenticated user can read their own row
CREATE POLICY "up: own select"
  ON public.user_profiles FOR SELECT
  USING (auth_subject = auth.uid()::text);

-- Admin can read ALL rows (for users management page)
-- Uses get_my_role() which is SECURITY DEFINER — no recursion
CREATE POLICY "up: admin select all"
  ON public.user_profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Users can insert their own row on signup
CREATE POLICY "up: own insert"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth_subject = auth.uid()::text);

-- Users can update their own row
CREATE POLICY "up: own update"
  ON public.user_profiles FOR UPDATE
  USING (auth_subject = auth.uid()::text)
  WITH CHECK (auth_subject = auth.uid()::text);

-- Admin can update any row (role changes)
CREATE POLICY "up: admin update"
  ON public.user_profiles FOR UPDATE
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Admin can delete any row
CREATE POLICY "up: admin delete"
  ON public.user_profiles FOR DELETE
  USING (public.get_my_role() = 'admin');

-- ─── Ensure grants ────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;

-- ─── Fix citizens table ───────────────────────────────────────
DROP POLICY IF EXISTS "citizens: own read" ON public.citizens;
DROP POLICY IF EXISTS "citizens: own select" ON public.citizens;
DROP POLICY IF EXISTS "citizens: staff read all" ON public.citizens;
DROP POLICY IF EXISTS "citizens: staff select all" ON public.citizens;
DROP POLICY IF EXISTS "citizens: own update" ON public.citizens;

CREATE POLICY "citizens: own select"
  ON public.citizens FOR SELECT
  USING (citizen_id = public.get_my_citizen_id());

CREATE POLICY "citizens: staff select"
  ON public.citizens FOR SELECT
  USING (public.get_my_role() IN ('officer', 'admin', 'analyst'));

CREATE POLICY "citizens: own update"
  ON public.citizens FOR UPDATE
  USING (citizen_id = public.get_my_citizen_id());

CREATE POLICY "citizens: own insert"
  ON public.citizens FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE ON public.citizens TO authenticated;

-- ─── Fix intelligence_reports ─────────────────────────────────
DROP POLICY IF EXISTS "intelligence_reports: staff select" ON public.intelligence_reports;
DROP POLICY IF EXISTS "intelligence_reports: staff read" ON public.intelligence_reports;
DROP POLICY IF EXISTS "intelligence_reports: authenticated read" ON public.intelligence_reports;
DROP POLICY IF EXISTS "intelligence_reports: anon read" ON public.intelligence_reports;

-- Open read for all authenticated users (it's aggregate public data)
CREATE POLICY "intelligence_reports: read"
  ON public.intelligence_reports FOR SELECT
  USING (auth.uid() IS NOT NULL);

GRANT SELECT ON public.intelligence_reports TO authenticated;
GRANT SELECT ON public.intelligence_reports TO anon;

-- ─── Schema usage (ensure it's set) ──────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
