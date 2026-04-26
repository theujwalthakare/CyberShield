import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { normalizeRole } from "@/lib/rbac";
import { getRoleHomePath } from "@/lib/legacy-dashboard";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const roleParam = normalizeRole(searchParams.get("role")) ?? "citizen";

  if (!code) return NextResponse.redirect(`${origin}/sign-in`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

  // Single response object — never recreate it after setAll
  const response = NextResponse.redirect(`${origin}${getRoleHomePath(roleParam)}`);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/sign-in`);

  const user = data.user;

  // Check if profile already exists to avoid overwriting an existing role
  const { data: existing } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("auth_subject", user.id)
    .maybeSingle();

  const effectiveRole = normalizeRole(existing?.role) ?? roleParam;

  if (!existing) {
    await supabase.from("user_profiles").insert({
      auth_subject: user.id,
      role: roleParam,
      email: user.email ?? null,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    });
  }

  // Redirect to the role's actual home (use DB role if already registered)
  const destination = `${origin}${getRoleHomePath(effectiveRole)}`;
  response.headers.set("location", destination);

  return response;
}
