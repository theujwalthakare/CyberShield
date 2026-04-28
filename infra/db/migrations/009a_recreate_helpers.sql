-- ============================================================
-- 009a: Recreate helper functions (run BEFORE 009)
-- Run in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles
  WHERE auth_subject = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_officer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT officer_id FROM public.user_profiles
  WHERE auth_subject = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_citizen_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT citizen_id FROM public.user_profiles
  WHERE auth_subject = auth.uid()::text
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_officer_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_citizen_id() TO authenticated;
