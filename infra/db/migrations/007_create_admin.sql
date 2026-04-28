-- ============================================================
-- Create Admin User Profile
-- 
-- STEP 1: First create the auth user in Supabase Dashboard:
--   Authentication → Users → Add user → Create new user
--   Email: admin@cybershield.gov.in
--   Password: Admin@123 (change this!)
--
-- STEP 2: Run this query — it auto-finds the user by email
-- ============================================================

INSERT INTO public.user_profiles (auth_subject, role, email, full_name)
SELECT 
  id::text,
  'admin',
  email,
  'System Administrator'
FROM auth.users
WHERE email = 'admin@cybershield.gov.in'
ON CONFLICT (auth_subject) 
DO UPDATE SET role = 'admin', full_name = 'System Administrator';
