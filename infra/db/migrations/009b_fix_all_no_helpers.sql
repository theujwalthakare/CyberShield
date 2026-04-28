-- ============================================================
-- 009b: Fix all permissions — NO helper function dependencies
-- Run in Supabase SQL Editor (replaces 009)
-- ============================================================

-- ─── Schema usage ─────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ─── officers ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "officers: own read" ON public.officers;
DROP POLICY IF EXISTS "officers: own select" ON public.officers;
DROP POLICY IF EXISTS "officers: own update" ON public.officers;
DROP POLICY IF EXISTS "officers: officer role read all" ON public.officers;
DROP POLICY IF EXISTS "officers: staff select all" ON public.officers;
DROP POLICY IF EXISTS "officers: staff read all" ON public.officers;
DROP POLICY IF EXISTS "officers: pending own select" ON public.officers;
DROP POLICY IF EXISTS "officers: authenticated insert own" ON public.officers;
DROP POLICY IF EXISTS "officers: insert on signup" ON public.officers;
DROP POLICY IF EXISTS "officers: admin update" ON public.officers;
DROP POLICY IF EXISTS "officers: admin delete" ON public.officers;
DROP POLICY IF EXISTS "officers: authenticated read" ON public.officers;

-- All authenticated users can read officers
CREATE POLICY "officers: read"
  ON public.officers FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Officer updates their own row via keycloak_id = auth.uid()
CREATE POLICY "officers: own update"
  ON public.officers FOR UPDATE
  USING (keycloak_id = auth.uid()::text);

-- Insert on signup — keycloak_id matches auth.uid()
CREATE POLICY "officers: insert"
  ON public.officers FOR INSERT
  WITH CHECK (keycloak_id = auth.uid()::text);

-- Admin update/delete via subquery on user_profiles (no helper function)
CREATE POLICY "officers: admin update"
  ON public.officers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "officers: admin delete"
  ON public.officers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.officers TO authenticated;

-- ─── user_profiles ────────────────────────────────────────────
DROP POLICY IF EXISTS "up: own select" ON public.user_profiles;
DROP POLICY IF EXISTS "up: select" ON public.user_profiles;
DROP POLICY IF EXISTS "up: own update" ON public.user_profiles;
DROP POLICY IF EXISTS "up: own insert" ON public.user_profiles;
DROP POLICY IF EXISTS "up: admin read all" ON public.user_profiles;
DROP POLICY IF EXISTS "up: admin select all" ON public.user_profiles;
DROP POLICY IF EXISTS "up: admin update all" ON public.user_profiles;
DROP POLICY IF EXISTS "up: admin update" ON public.user_profiles;
DROP POLICY IF EXISTS "up: admin delete" ON public.user_profiles;
DROP POLICY IF EXISTS "up: pending own select" ON public.user_profiles;
DROP POLICY IF EXISTS "up: service insert" ON public.user_profiles;

-- Own row select
CREATE POLICY "up: own select"
  ON public.user_profiles FOR SELECT
  USING (auth_subject = auth.uid()::text);

-- Admin select all — direct subquery, no helper
CREATE POLICY "up: admin select"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up2
      WHERE up2.auth_subject = auth.uid()::text AND up2.role = 'admin'
    )
  );

-- Own insert
CREATE POLICY "up: own insert"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth_subject = auth.uid()::text);

-- Own update
CREATE POLICY "up: own update"
  ON public.user_profiles FOR UPDATE
  USING (auth_subject = auth.uid()::text)
  WITH CHECK (auth_subject = auth.uid()::text);

-- Admin update any row
CREATE POLICY "up: admin update"
  ON public.user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up2
      WHERE up2.auth_subject = auth.uid()::text AND up2.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up2
      WHERE up2.auth_subject = auth.uid()::text AND up2.role = 'admin'
    )
  );

-- Admin delete
CREATE POLICY "up: admin delete"
  ON public.user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up2
      WHERE up2.auth_subject = auth.uid()::text AND up2.role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;

-- ─── citizens ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "citizens: own read" ON public.citizens;
DROP POLICY IF EXISTS "citizens: own select" ON public.citizens;
DROP POLICY IF EXISTS "citizens: staff read all" ON public.citizens;
DROP POLICY IF EXISTS "citizens: staff select all" ON public.citizens;
DROP POLICY IF EXISTS "citizens: staff select" ON public.citizens;
DROP POLICY IF EXISTS "citizens: own update" ON public.citizens;
DROP POLICY IF EXISTS "citizens: own insert" ON public.citizens;

CREATE POLICY "citizens: own select"
  ON public.citizens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND citizen_id = citizens.citizen_id
    )
  );

CREATE POLICY "citizens: staff select"
  ON public.citizens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin','analyst')
    )
  );

CREATE POLICY "citizens: own update"
  ON public.citizens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND citizen_id = citizens.citizen_id
    )
  );

CREATE POLICY "citizens: insert"
  ON public.citizens FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE ON public.citizens TO authenticated;

-- ─── complaints ───────────────────────────────────────────────
DROP POLICY IF EXISTS "complaints: citizen select own" ON public.complaints;
DROP POLICY IF EXISTS "complaints: staff select all" ON public.complaints;
DROP POLICY IF EXISTS "complaints: citizen insert" ON public.complaints;
DROP POLICY IF EXISTS "complaints: officer update" ON public.complaints;

CREATE POLICY "complaints: citizen select own"
  ON public.complaints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.citizens c ON c.citizen_id = up.citizen_id
      WHERE up.auth_subject = auth.uid()::text AND c.citizen_id = complaints.victim_id
    )
  );

CREATE POLICY "complaints: staff select"
  ON public.complaints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin','analyst')
    )
  );

CREATE POLICY "complaints: citizen insert"
  ON public.complaints FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.citizens c ON c.citizen_id = up.citizen_id
      WHERE up.auth_subject = auth.uid()::text AND c.citizen_id = complaints.victim_id
    )
  );

CREATE POLICY "complaints: staff update"
  ON public.complaints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin')
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;

-- ─── intelligence_reports ─────────────────────────────────────
DROP POLICY IF EXISTS "intelligence_reports: staff select" ON public.intelligence_reports;
DROP POLICY IF EXISTS "intelligence_reports: staff read" ON public.intelligence_reports;
DROP POLICY IF EXISTS "intelligence_reports: authenticated read" ON public.intelligence_reports;
DROP POLICY IF EXISTS "intelligence_reports: anon read" ON public.intelligence_reports;
DROP POLICY IF EXISTS "intelligence_reports: read" ON public.intelligence_reports;

CREATE POLICY "intelligence_reports: read"
  ON public.intelligence_reports FOR SELECT
  USING (true);

GRANT SELECT ON public.intelligence_reports TO authenticated;
GRANT SELECT ON public.intelligence_reports TO anon;

-- ─── Other tables ─────────────────────────────────────────────
DROP POLICY IF EXISTS "complaint_entities: staff select" ON public.complaint_entities;
CREATE POLICY "complaint_entities: staff select"
  ON public.complaint_entities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin','analyst')
    )
  );
GRANT SELECT ON public.complaint_entities TO authenticated;

DROP POLICY IF EXISTS "evidence_files: staff select" ON public.evidence_files;
DROP POLICY IF EXISTS "evidence_files: officer insert" ON public.evidence_files;
CREATE POLICY "evidence_files: staff select"
  ON public.evidence_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin','analyst')
    )
  );
CREATE POLICY "evidence_files: staff insert"
  ON public.evidence_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin')
    )
  );
GRANT SELECT, INSERT ON public.evidence_files TO authenticated;

DROP POLICY IF EXISTS "safety_guidance_delivery: staff read" ON public.safety_guidance_delivery;
CREATE POLICY "safety_guidance_delivery: staff select"
  ON public.safety_guidance_delivery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin','analyst')
    )
  );
GRANT SELECT ON public.safety_guidance_delivery TO authenticated;

DROP POLICY IF EXISTS "ai_decisions: staff select" ON public.ai_decisions;
CREATE POLICY "ai_decisions: staff select"
  ON public.ai_decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin','analyst')
    )
  );
GRANT SELECT ON public.ai_decisions TO authenticated;

DROP POLICY IF EXISTS "fir_drafts: officer select" ON public.fir_drafts;
DROP POLICY IF EXISTS "fir_drafts: officer update" ON public.fir_drafts;
CREATE POLICY "fir_drafts: staff select"
  ON public.fir_drafts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin')
    )
  );
CREATE POLICY "fir_drafts: staff update"
  ON public.fir_drafts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin')
    )
  );
GRANT SELECT, UPDATE ON public.fir_drafts TO authenticated;

DROP POLICY IF EXISTS "case_lifecycle: staff select" ON public.case_lifecycle;
DROP POLICY IF EXISTS "case_lifecycle: officer update" ON public.case_lifecycle;
CREATE POLICY "case_lifecycle: staff select"
  ON public.case_lifecycle FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin','analyst')
    )
  );
CREATE POLICY "case_lifecycle: staff update"
  ON public.case_lifecycle FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin')
    )
  );
GRANT SELECT, UPDATE ON public.case_lifecycle TO authenticated;

DROP POLICY IF EXISTS "cfcfrms_requests: officer select" ON public.cfcfrms_requests;
CREATE POLICY "cfcfrms_requests: staff select"
  ON public.cfcfrms_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role IN ('officer','admin')
    )
  );
GRANT SELECT ON public.cfcfrms_requests TO authenticated;

DROP POLICY IF EXISTS "knowledge_base: authenticated read" ON public.knowledge_base;
DROP POLICY IF EXISTS "knowledge_base: authenticated select" ON public.knowledge_base;
DROP POLICY IF EXISTS "knowledge_base: admin write" ON public.knowledge_base;
CREATE POLICY "knowledge_base: read"
  ON public.knowledge_base FOR SELECT
  USING (true);
CREATE POLICY "knowledge_base: admin write"
  ON public.knowledge_base FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE auth_subject = auth.uid()::text AND role = 'admin'
    )
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_base TO authenticated;
GRANT SELECT ON public.knowledge_base TO anon;
