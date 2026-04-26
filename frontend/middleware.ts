import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { canAccessPath, normalizeRole } from "@/lib/rbac";

const AUTH_ROUTES = ["/sign-in", "/sign-up", "/auth/sign-in", "/auth/sign-up"];
const PENDING_PAGE = "/pending-approval";

function getRoleHomePath(role: string | null) {
  switch (role) {
    case "admin":    return "/admin/dashboard";
    case "officer":  return "/officer/dashboard";
    case "citizen":  return "/citizen/dashboard";
    case "analyst":  return "/analyst/dashboard";
    default:         return "/sign-in?error=missing-role";
  }
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/officer") ||
    pathname.startsWith("/citizen") ||
    pathname.startsWith("/analyst") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api")
  );
}

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }
  return { supabaseUrl, supabaseAnonKey };
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  // Allow pending-approval page through without auth check
  if (pathname === PENDING_PAGE) {
    const response = NextResponse.next({ request });
    applySecurityHeaders(response);
    return response;
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Unauthenticated → redirect to sign-in
  if (isProtectedPath(pathname) && !user) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    const r = NextResponse.redirect(signInUrl);
    applySecurityHeaders(r);
    return r;
  }

  if (user && isProtectedPath(pathname) && !isAuthRoute) {
    const metadataRole = normalizeRole(
      user.app_metadata?.role ?? user.user_metadata?.role
    );

    // Fetch profile + officer/analyst activation status in one query
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, officer_id")
      .eq("auth_subject", user.id)
      .maybeSingle();

    const role = normalizeRole(profile?.role) ?? metadataRole;

    if (!role) {
      const r = NextResponse.redirect(new URL("/sign-in?error=missing-role", request.url));
      applySecurityHeaders(r);
      return r;
    }

    // ── Activation check for officer and analyst ──────────────────
    if (role === "officer" && profile?.officer_id) {
      const { data: officer } = await supabase
        .from("officers")
        .select("is_active")
        .eq("officer_id", profile.officer_id)
        .maybeSingle();

      if (officer && !officer.is_active) {
        const r = NextResponse.redirect(new URL(PENDING_PAGE, request.url));
        applySecurityHeaders(r);
        return r;
      }
    }

    // Analyst pending check — stored as is_active false on user_profiles
    // We use a dedicated pending_approval flag approach: role = "pending_officer" | "pending_analyst"
    if ((role as string) === "pending_officer" || (role as string) === "pending_analyst") {
      const r = NextResponse.redirect(new URL(PENDING_PAGE, request.url));
      applySecurityHeaders(r);
      return r;
    }

    // ── Role-based path access ────────────────────────────────────
    if (!canAccessPath(role, pathname)) {
      const r = NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
      applySecurityHeaders(r);
      return r;
    }
  }

  applySecurityHeaders(response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
