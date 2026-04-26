export type AppRole = "citizen" | "officer" | "analyst" | "admin";

export const APP_ROLES: AppRole[] = ["citizen", "officer", "analyst", "admin"];

// Permissions each role holds
export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  citizen: [
    "incident:create",
    "incident:read_own",
    "case:read_own",
    "knowledge:read",
    "profile:read_own",
    "profile:update_own",
  ],
  officer: [
    "incident:create",
    "incident:read_all",
    "incident:update",
    "case:read_all",
    "case:update",
    "case:assign",
    "evidence:upload",
    "evidence:read",
    "alert:read",
    "alert:acknowledge",
    "analytics:read",
    "intelligence:read",
    "knowledge:read",
    "knowledge:create",
    "profile:read_own",
    "profile:update_own",
  ],
  analyst: [
    "incident:read_all",
    "case:read_all",
    "analytics:read",
    "intelligence:read",
    "alert:read",
    "alert:create",
    "alert:acknowledge",
    "knowledge:read",
    "profile:read_own",
    "profile:update_own",
  ],
  admin: [
    "incident:create",
    "incident:read_all",
    "incident:update",
    "incident:delete",
    "case:read_all",
    "case:update",
    "case:assign",
    "case:close",
    "evidence:upload",
    "evidence:read",
    "evidence:delete",
    "alert:read",
    "alert:create",
    "alert:acknowledge",
    "alert:delete",
    "analytics:read",
    "intelligence:read",
    "knowledge:read",
    "knowledge:create",
    "knowledge:delete",
    "user:read_all",
    "user:update",
    "user:delete",
    "audit:read",
    "profile:read_own",
    "profile:update_own",
  ],
};

export function hasPermission(role: AppRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function normalizeRole(value: unknown): AppRole | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return APP_ROLES.includes(normalized as AppRole) ? (normalized as AppRole) : null;
}

// Route-level access control
const ROUTE_PERMISSIONS: { prefix: string; required: string }[] = [
  { prefix: "/admin/dashboard", required: "user:read_all" },
  { prefix: "/admin/users", required: "user:read_all" },
  { prefix: "/admin/settings", required: "audit:read" },
  { prefix: "/officer/dashboard", required: "case:read_all" },
  { prefix: "/officer/queue", required: "case:read_all" },
  { prefix: "/officer/complaint", required: "case:read_all" },
  { prefix: "/officer/analytics", required: "analytics:read" },
  { prefix: "/citizen/dashboard", required: "case:read_own" },
  { prefix: "/citizen/file-complaint", required: "incident:create" },
  { prefix: "/citizen/my-complaints", required: "case:read_own" },
  { prefix: "/analyst/dashboard", required: "analytics:read" },
  { prefix: "/analyst/intelligence", required: "intelligence:read" },
  { prefix: "/dashboard/admin", required: "user:read_all" },
  { prefix: "/dashboard/alerts", required: "alert:read" },
  { prefix: "/dashboard/analytics", required: "analytics:read" },
  { prefix: "/dashboard/intelligence", required: "intelligence:read" },
  { prefix: "/dashboard/evidence", required: "evidence:read" },
  { prefix: "/dashboard/cases", required: "case:read_own" },
  { prefix: "/dashboard/report", required: "incident:create" },
  { prefix: "/dashboard/knowledge", required: "knowledge:read" },
  { prefix: "/dashboard/profile", required: "profile:read_own" },
];

export function canAccessPath(role: AppRole, pathname: string): boolean {
  for (const { prefix, required } of ROUTE_PERMISSIONS) {
    if (pathname.startsWith(prefix)) {
      return hasPermission(role, required);
    }
  }
  // /dashboard root — all roles can access
  return true;
}

// Nav items visible per role
export const NAV_PERMISSIONS: Record<string, string> = {
  "/admin/dashboard": "user:read_all",
  "/admin/users": "user:read_all",
  "/admin/settings": "audit:read",
  "/officer/dashboard": "case:read_all",
  "/officer/queue": "case:read_all",
  "/officer/analytics": "analytics:read",
  "/citizen/dashboard": "case:read_own",
  "/citizen/file-complaint": "incident:create",
  "/citizen/my-complaints": "case:read_own",
  "/analyst/dashboard": "analytics:read",
  "/analyst/intelligence": "intelligence:read",
  "/dashboard/report": "incident:create",
  "/dashboard/cases": "case:read_own",
  "/dashboard/evidence": "evidence:read",
  "/dashboard/analytics": "analytics:read",
  "/dashboard/intelligence": "intelligence:read",
  "/dashboard/alerts": "alert:read",
  "/dashboard/knowledge": "knowledge:read",
  "/dashboard/admin": "user:read_all",
};
