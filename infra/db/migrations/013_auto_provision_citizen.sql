-- ============================================================
-- 013: Auto-provision citizen profile on signup (safe version)
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Drop old trigger + functions if they exist ───────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();
DROP FUNCTION IF EXISTS public.provision_citizen_profile(text, text, text, text);

-- ── 1. provision_citizen_profile ─────────────────────────────
-- Creates a citizens row (with a placeholder mobile) + links
-- user_profiles.citizen_id. Idempotent — safe to call many times.

CREATE OR REPLACE FUNCTION public.provision_citizen_profile(
  p_auth_subject  text,
  p_email         text DEFAULT NULL,
  p_full_name     text DEFAULT NULL,
  p_phone         text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_citizen_id  uuid;
  v_existing_id uuid;
  v_mobile      varchar(15);
BEGIN
  -- Already provisioned?
  SELECT citizen_id INTO v_existing_id
  FROM public.user_profiles
  WHERE auth_subject = p_auth_subject
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  -- Build a unique placeholder mobile from the auth subject
  -- Format: +91 + last 10 hex chars of uuid → always unique, always 15 chars
  v_mobile := '+91' || UPPER(RIGHT(REPLACE(p_auth_subject, '-', ''), 10));

  v_citizen_id := gen_random_uuid();

  -- Insert citizens row — mobile_number is required NOT NULL UNIQUE
  INSERT INTO public.citizens (
    citizen_id,
    mobile_number,
    mobile_verified,
    full_name,
    preferred_language,
    created_at
  ) VALUES (
    v_citizen_id,
    v_mobile,
    FALSE,
    COALESCE(p_full_name, split_part(COALESCE(p_email, ''), '@', 1), 'Citizen'),
    'en',
    now()
  )
  ON CONFLICT (mobile_number) DO NOTHING;

  -- If the insert was skipped (conflict), fetch the existing citizen_id
  IF NOT FOUND THEN
    SELECT citizen_id INTO v_citizen_id
    FROM public.citizens
    WHERE mobile_number = v_mobile
    LIMIT 1;
  END IF;

  -- Upsert user_profiles linking auth_subject → citizen_id
  INSERT INTO public.user_profiles (
    auth_subject,
    role,
    email,
    full_name,
    citizen_id,
    officer_id,
    created_at,
    last_login_at
  ) VALUES (
    p_auth_subject,
    'citizen',
    p_email,
    p_full_name,
    v_citizen_id,
    NULL,
    now(),
    now()
  )
  ON CONFLICT (auth_subject)
  DO UPDATE SET
    citizen_id    = EXCLUDED.citizen_id,
    last_login_at = now()
  WHERE public.user_profiles.citizen_id IS NULL;

  RETURN v_citizen_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.provision_citizen_profile(text, text, text, text)
  TO authenticated, anon, service_role;

-- ── 2. handle_new_auth_user ───────────────────────────────────
-- Fires on every new Supabase auth signup.
-- CRITICAL: wrapped in BEGIN/EXCEPTION so it NEVER blocks signup.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := COALESCE(
    NEW.raw_app_meta_data->>'role',
    NEW.raw_user_meta_data->>'role',
    'citizen'
  );

  IF v_role = 'citizen' THEN
    BEGIN
      PERFORM public.provision_citizen_profile(
        NEW.id::text,
        NEW.email,
        COALESCE(
          NEW.raw_user_meta_data->>'full_name',
          NEW.raw_user_meta_data->>'name'
        ),
        NEW.raw_user_meta_data->>'phone'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log but never block signup
      RAISE WARNING 'provision_citizen_profile failed for %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- ── 3. Attach trigger ─────────────────────────────────────────
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
