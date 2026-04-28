-- ============================================================
-- 008: Fix intelligence_reports access + log actual errors
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "intelligence_reports: staff select" ON public.intelligence_reports;

-- Allow ALL authenticated users to read intelligence_reports
-- (it's public intelligence data, not PII)
CREATE POLICY "intelligence_reports: authenticated read"
  ON public.intelligence_reports FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Also ensure anon can read it (for public-facing pages)
CREATE POLICY "intelligence_reports: anon read"
  ON public.intelligence_reports FOR SELECT
  USING (true);

-- Grant to both roles
GRANT SELECT ON public.intelligence_reports TO authenticated;
GRANT SELECT ON public.intelligence_reports TO anon;

-- Same fix for knowledge_base (already has authenticated read but ensure anon too)
DROP POLICY IF EXISTS "knowledge_base: authenticated select" ON public.knowledge_base;
CREATE POLICY "knowledge_base: authenticated read"
  ON public.knowledge_base FOR SELECT
  USING (true);
GRANT SELECT ON public.knowledge_base TO anon;
