import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { normalizeRole, type AppRole } from "@/lib/rbac";

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}

// Resolves role from user_profiles using auth_subject (= auth.uid())
async function fetchRoleByAuthSubject(
  authSubject: string,
  fallbackRole: AppRole | null,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<AppRole | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("auth_subject", authSubject)
    .maybeSingle();

  return normalizeRole(data?.role) ?? fallbackRole;
}

export async function getServerUserAndRole(): Promise<{
  user: User | null;
  role: AppRole | null;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null };

  const metadataRole = normalizeRole(
    user.app_metadata?.role ?? user.user_metadata?.role
  );
  const role = await fetchRoleByAuthSubject(user.id, metadataRole, supabase);

  return { user, role };
}
