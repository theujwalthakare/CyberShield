-- ============================================================
-- 010: Complete RLS setup — functions first, then policies
-- Run entire file at once in Supabase SQL Editor
-- ============================================================

-- ─── Step 1: Helper functions (SECURITY DEFINER bypasses RLS) ─
-- These run as postgres superuser so they can read user_profiles
-- without triggering any RLS policy on it.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_profiles WHERE auth_subject = auth.uid()::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_officer_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT officer_id FROM public.user_profiles WHERE auth_subject = auth.uid()::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_citizen_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT citizen_id FROM public.user_profiles WHERE auth_subject = auth.uid()::text LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role()        TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_officer_id()  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_citizen_id()  TO authenticated;

-- ─── Step 2: Schema + sequence grants ─────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ─── Step 3: Drop ALL existing policies (clean slate) ─────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ─── Step 4: user_profiles ────────────────────────────────────
-- CRITICAL: Never query user_profiles inside a user_profiles policy.
-- Use auth.uid() directly for own-row checks.
-- Use get_my_role() (SECURITY DEFINER) for admin checks — it reads
-- user_profiles as superuser, bypassing RLS entirely.

CREATE POLICY "up: own select"
  ON public.user_profiles FOR SELECT
  USING (auth_subject = auth.uid()::text);

CREATE POLICY "up: admin select"
  ON public.user_profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "up: own insert"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth_subject = auth.uid()::text);

CREATE POLICY "up: own update"
  ON public.user_profiles FOR UPDATE
  USING (auth_subject = auth.uid()::text)
  WITH CHECK (auth_subject = auth.uid()::text);

CREATE POLICY "up: admin update"
  ON public.user_profiles FOR UPDATE
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "up: admin delete"
  ON public.user_profiles FOR DELETE
  USING (public.get_my_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;

-- ─── Step 5: officers ─────────────────────────────────────────
CREATE POLICY "officers: read"
  ON public.officers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "officers: own update"
  ON public.officers FOR UPDATE
  USING (keycloak_id = auth.uid()::text);

CREATE POLICY "officers: admin update"
  ON public.officers FOR UPDATE
  USING (public.get_my_role() = 'admin');

CREATE POLICY "officers: admin delete"
  ON public.officers FOR DELETE
  USING (public.get_my_role() = 'admin');

CREATE POLICY "officers: insert"
  ON public.officers FOR INSERT
  WITH CHECK (keycloak_id = auth.uid()::text);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.officers TO authenticated;

-- ─── Step 6: citizens ─────────────────────────────────────────
CREATE POLICY "citizens: own select"
  ON public.citizens FOR SELECT
  USING (citizen_id = public.get_my_citizen_id());

CREATE POLICY "citizens: staff select"
  ON public.citizens FOR SELECT
  USING (public.get_my_role() IN ('officer','admin','analyst'));

CREATE POLICY "citizens: own update"
  ON public.citizens FOR UPDATE
  USING (citizen_id = public.get_my_citizen_id());

CREATE POLICY "citizens: insert"
  ON public.citizens FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE ON public.citizens TO authenticated;

-- ─── Step 7: complaints ───────────────────────────────────────
CREATE POLICY "complaints: citizen select"
  ON public.complaints FOR SELECT
  USING (victim_id = public.get_my_citizen_id());

CREATE POLICY "complaints: staff select"
  ON public.complaints FOR SELECT
  USING (public.get_my_role() IN ('officer','admin','analyst'));

CREATE POLICY "complaints: citizen insert"
  ON public.complaints FOR INSERT
  WITH CHECK (victim_id = public.get_my_citizen_id());

CREATE POLICY "complaints: staff update"
  ON public.complaints FOR UPDATE
  USING (public.get_my_role() IN ('officer','admin'));

GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;

-- ─── Step 8: intelligence_reports (open read) ─────────────────
CREATE POLICY "intelligence_reports: read"
  ON public.intelligence_reports FOR SELECT
  USING (true);

GRANT SELECT ON public.intelligence_reports TO authenticated, anon;

-- ─── Step 9: complaint_entities ───────────────────────────────
CREATE POLICY "complaint_entities: staff select"
  ON public.complaint_entities FOR SELECT
  USING (public.get_my_role() IN ('officer','admin','analyst'));

GRANT SELECT ON public.complaint_entities TO authenticated;

-- ─── Step 10: evidence_files ──────────────────────────────────
CREATE POLICY "evidence_files: staff select"
  ON public.evidence_files FOR SELECT
  USING (public.get_my_role() IN ('officer','admin','analyst'));

CREATE POLICY "evidence_files: staff insert"
  ON public.evidence_files FOR INSERT
  WITH CHECK (public.get_my_role() IN ('officer','admin'));

GRANT SELECT, INSERT ON public.evidence_files TO authenticated;

-- ─── Step 11: ai_decisions ────────────────────────────────────
CREATE POLICY "ai_decisions: staff select"
  ON public.ai_decisions FOR SELECT
  USING (public.get_my_role() IN ('officer','admin','analyst'));

GRANT SELECT ON public.ai_decisions TO authenticated;

-- ─── Step 12: fir_drafts ──────────────────────────────────────
CREATE POLICY "fir_drafts: staff select"
  ON public.fir_drafts FOR SELECT
  USING (public.get_my_role() IN ('officer','admin'));

CREATE POLICY "fir_drafts: staff update"
  ON public.fir_drafts FOR UPDATE
  USING (public.get_my_role() IN ('officer','admin'));

GRANT SELECT, UPDATE ON public.fir_drafts TO authenticated;

-- ─── Step 13: case_lifecycle ──────────────────────────────────
CREATE POLICY "case_lifecycle: staff select"
  ON public.case_lifecycle FOR SELECT
  USING (public.get_my_role() IN ('officer','admin','analyst'));

CREATE POLICY "case_lifecycle: staff update"
  ON public.case_lifecycle FOR UPDATE
  USING (public.get_my_role() IN ('officer','admin'));

GRANT SELECT, UPDATE ON public.case_lifecycle TO authenticated;

-- ─── Step 14: cfcfrms_requests ────────────────────────────────
CREATE POLICY "cfcfrms_requests: staff select"
  ON public.cfcfrms_requests FOR SELECT
  USING (public.get_my_role() IN ('officer','admin'));

GRANT SELECT ON public.cfcfrms_requests TO authenticated;

-- ─── Step 15: safety_guidance_delivery ───────────────────────
CREATE POLICY "safety_guidance_delivery: staff select"
  ON public.safety_guidance_delivery FOR SELECT
  USING (public.get_my_role() IN ('officer','admin','analyst'));

GRANT SELECT ON public.safety_guidance_delivery TO authenticated;

-- ─── Step 16: knowledge_base ──────────────────────────────────
CREATE POLICY "knowledge_base: read"
  ON public.knowledge_base FOR SELECT
  USING (true);

CREATE POLICY "knowledge_base: admin write"
  ON public.knowledge_base FOR ALL
  USING (public.get_my_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_base TO authenticated, anon;
