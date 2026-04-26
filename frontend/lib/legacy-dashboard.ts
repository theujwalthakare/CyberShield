import type { AppRole } from "@/lib/rbac";

const ROLE_HOME_PATHS: Record<AppRole, string> = {
  admin: "/admin/dashboard",
  officer: "/officer/dashboard",
  citizen: "/citizen/dashboard",
  analyst: "/analyst/dashboard",
};

const LEGACY_ROUTE_PATHS: Record<string, Partial<Record<AppRole, string>>> = {
  report: {
    citizen: "/citizen/file-complaint",
    officer: "/officer/queue",
    analyst: "/analyst/dashboard",
    admin: "/admin/dashboard",
  },
  cases: {
    citizen: "/citizen/my-complaints",
    officer: "/officer/queue",
    analyst: "/analyst/dashboard",
    admin: "/admin/dashboard",
  },
  evidence: {
    officer: "/officer/dashboard",
    analyst: "/analyst/dashboard",
    admin: "/admin/dashboard",
    citizen: "/citizen/dashboard",
  },
  analytics: {
    officer: "/officer/analytics",
    analyst: "/analyst/analytics",
    admin: "/admin/dashboard",
    citizen: "/citizen/dashboard",
  },
  intelligence: {
    analyst: "/analyst/intelligence",
    officer: "/officer/dashboard",
    admin: "/admin/dashboard",
    citizen: "/citizen/dashboard",
  },
  alerts: {
    officer: "/officer/dashboard",
    analyst: "/analyst/dashboard",
    admin: "/admin/dashboard",
    citizen: "/citizen/dashboard",
  },
  knowledge: {
    officer: "/officer/dashboard",
    analyst: "/analyst/dashboard",
    admin: "/admin/dashboard",
    citizen: "/citizen/dashboard",
  },
  profile: {
    officer: "/officer/dashboard",
    analyst: "/analyst/dashboard",
    admin: "/admin/dashboard",
    citizen: "/citizen/dashboard",
  },
  admin: {
    admin: "/admin/dashboard",
  },
  officer: {
    officer: "/officer/dashboard",
  },
  map: {
    officer: "/officer/dashboard",
    analyst: "/analyst/dashboard",
    admin: "/admin/dashboard",
    citizen: "/citizen/dashboard",
  },
};

export function getRoleHomePath(role: AppRole | null) {
  return role ? ROLE_HOME_PATHS[role] : "/sign-in?error=missing-role";
}

export function getLegacyDashboardRedirectPath(role: AppRole | null, slug: string[] = []) {
  if (!role) {
    return "/sign-in?error=missing-role";
  }

  if (slug.length === 0) {
    return ROLE_HOME_PATHS[role];
  }

  const [section] = slug;
  return LEGACY_ROUTE_PATHS[section]?.[role] ?? ROLE_HOME_PATHS[role];
}