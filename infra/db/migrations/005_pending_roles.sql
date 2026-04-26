-- ============================================================
-- 005: Pending Roles Support (Officer & Analyst Approval Flow)
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── user_profiles ───────────────────────────────────────────
-- The "up: select" policy from 004 already allows own-row reads.
-- Pending users (pending_officer / pending_analyst) need to:
--   1. Read their own profile to check role status
--   2. Insert their own profile on sign-up (already covered by "up: own insert")

-- Drop the incomplete stub from the earlier partial run
DROP POLICY IF EXISTS "up: pending own select" ON public.user_profiles;

-- Pending users can update their own row (not needed currently, but safe to have)
-- Already covered by "up: own update" from migration 002.

-- ─── officers ────────────────────────────────────────────────
-- Pending officers need to read their own officers row so the
-- middleware can check is_active and redirect to /pending-approval.

DROP POLICY IF EXISTS "officers: pending own select" ON public.officers;

CREATE POLICY "officers: pending own select"
  ON public.officers FOR SELECT
  USING (officer_id = public.get_my_officer_id());

-- ─── Approval action: admin sets role + is_active ─────────────
-- When admin approves a pending_officer:
--   UPDATE user_profiles SET role = 'officer' WHERE user_id = ?
--   UPDATE officers SET is_active = true WHERE officer_id = ?
-- Both already covered by:
--   "up: admin update all"  (migration 004)
--   "officers: own update"  (migration 002)
-- No new policies needed for the approval action itself.

-- ─── Sign-up: pending_officer inserts into officers table ─────
-- During officer sign-up, the new user inserts their own officers row.
-- The insert happens before user_profiles exists, so get_my_officer_id()
-- returns NULL. We need a separate insert policy.

DROP POLICY IF EXISTS "officers: authenticated insert own" ON public.officers;

CREATE POLICY "officers: authenticated insert own"
  ON public.officers FOR INSERT
  WITH CHECK (
    -- keycloak_id stores the auth.uid() at sign-up time
    keycloak_id = auth.uid()::text
  );

GRANT INSERT ON public.officers TO authenticated;

-- ─── Sign-up: pending_analyst inserts into user_profiles ──────
-- Already covered by "up: own insert" (migration 002) which checks
-- auth_subject = auth.uid()::text.

-- ─── Pending page: read own profile ──────────────────────────
-- /pending-approval page calls:
--   supabase.from("user_profiles").select("role").eq("auth_subject", user.id)
--   supabase.from("officers").select("is_active").eq("officer_id", ...)
-- Both covered by existing policies above.

-- ─── Summary of what triggers the pending flow ───────────────
-- 1. Officer registers → user_profiles.role = 'pending_officer', officers.is_active = false
-- 2. Analyst registers → user_profiles.role = 'pending_analyst'
-- 3. Sign-in → middleware reads role → redirects to /pending-approval
-- 4. Admin approves:
--      UPDATE user_profiles SET role = 'officer'/'analyst'
--      UPDATE officers SET is_active = true  (officers only)
-- 5. User clicks "Check Status" on /pending-approval → redirected to dashboard
