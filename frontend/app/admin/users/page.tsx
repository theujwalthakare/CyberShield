"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, RefreshCw, Filter, MoreHorizontal, UserCheck, UserX,
  Trash2, ShieldCheck, Users, UserCircle2, Mail, Hash,
  MapPin, Building2, ChevronDown, X, Loader2, Plus,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { APP_ROLES, type AppRole } from "@/lib/rbac";

// ─── Types ────────────────────────────────────────────────────
type UserRow = {
  user_id: string;
  auth_subject: string;
  role: AppRole;
  email: string | null;
  full_name: string | null;
  created_at: string;
  last_login_at: string | null;
  citizen_id: string | null;
  officer_id: string | null;
  // officer fields
  badge_number: string | null;
  police_station: string | null;
  district_code: string | null;
  state_code: string | null;
  is_active: boolean;
  // citizen fields
  mobile_number: string | null;
};

const ROLE_BADGE: Record<AppRole, string> = {
  admin:   "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/20",
  officer: "bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/20",
  analyst: "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/20",
  citizen: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

// ─── Fetch ────────────────────────────────────────────────────
async function fetchAllUsers(): Promise<UserRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select(`
      user_id, auth_subject, role, email, full_name, created_at, last_login_at,
      citizen_id, officer_id,
      officers ( badge_number, police_station, district_code, state_code, is_active ),
      citizens ( mobile_number )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    user_id:       row.user_id,
    auth_subject:  row.auth_subject,
    role:          row.role as AppRole,
    email:         row.email ?? null,
    full_name:     row.full_name ?? null,
    created_at:    row.created_at,
    last_login_at: row.last_login_at ?? null,
    citizen_id:    row.citizen_id ?? null,
    officer_id:    row.officer_id ?? null,
    badge_number:  row.officers?.badge_number ?? null,
    police_station:row.officers?.police_station ?? null,
    district_code: row.officers?.district_code ?? null,
    state_code:    row.officers?.state_code ?? null,
    is_active:     row.officers?.is_active ?? true,
    mobile_number: row.citizens?.mobile_number ?? null,
  }));
}

// ─── Detail Dialog ────────────────────────────────────────────
function UserDetailDialog({ user, onClose, onRefresh }: {
  user: UserRow;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<AppRole>(user.role);
  const [fullName, setFullName] = useState(user.full_name ?? "");

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("user_profiles")
        .update({ role, full_name: fullName.trim() || null })
        .eq("user_id", user.user_id);
      if (error) throw new Error(error.message);
      toast.success("User updated");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally { setSaving(false); }
  }

  async function handleToggleActive(active: boolean) {
    if (!user.officer_id) return;
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("officers")
        .update({ is_active: active })
        .eq("officer_id", user.officer_id);
      if (error) throw new Error(error.message);
      toast.success(`Officer ${active ? "activated" : "deactivated"}`);
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
              {(user.full_name ?? user.email ?? "U").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{user.full_name || "Unnamed User"}</p>
              <p className="text-xs text-slate-500 font-normal">{user.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Editable fields */}
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={v => setRole(v as AppRole)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APP_ROLES.map(r => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Read-only info */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-2.5 text-sm">
            {[
              { icon: Mail, label: "Email", value: user.email },
              { icon: Hash, label: "Badge", value: user.badge_number },
              { icon: Building2, label: "Station", value: user.police_station },
              { icon: MapPin, label: "District", value: user.district_code },
              { icon: MapPin, label: "State", value: user.state_code },
              { icon: UserCircle2, label: "Mobile", value: user.mobile_number },
              { icon: ShieldCheck, label: "Auth ID", value: user.auth_subject?.slice(0, 16) + "…" },
              { icon: RefreshCw, label: "Last Login", value: user.last_login_at ? new Date(user.last_login_at).toLocaleString("en-IN") : "Never" },
              { icon: RefreshCw, label: "Joined", value: new Date(user.created_at).toLocaleDateString("en-IN") },
            ].filter(f => f.value).map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Icon className="w-3.5 h-3.5 shrink-0" />{label}
                </div>
                <span className="font-medium text-slate-900 dark:text-white text-right truncate max-w-[200px]">{value}</span>
              </div>
            ))}
          </div>

          {/* Officer toggle */}
          {user.role === "officer" && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Officer Status</p>
                <p className="text-xs text-slate-500">{user.is_active ? "Currently active" : "Currently inactive"}</p>
              </div>
              <Button
                size="sm"
                variant={user.is_active ? "destructive" : "default"}
                className="rounded-xl gap-1.5"
                onClick={() => handleToggleActive(!user.is_active)}
                disabled={saving}
              >
                {user.is_active ? <><UserX className="w-3.5 h-3.5" /> Deactivate</> : <><UserCheck className="w-3.5 h-3.5" /> Activate</>}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await fetchAllUsers());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.badge_number?.toLowerCase().includes(search.toLowerCase()) ||
        u.auth_subject?.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.is_active) ||
        (statusFilter === "inactive" && !u.is_active) ||
        (statusFilter === "pending" && (u.role as string === "pending_officer" || u.role as string === "pending_analyst"));
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const pendingUsers = useMemo(() =>
    users.filter(u => (u.role as string) === "pending_officer" || (u.role as string) === "pending_analyst"),
    [users]
  );

  const stats = useMemo(() => ({
    total: users.length,
    byRole: APP_ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {} as Record<AppRole, number>),
    inactive: users.filter(u => !u.is_active).length,
  }), [users]);

  async function handleRoleChange(user: UserRow, role: AppRole) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("user_profiles").update({ role }).eq("user_id", user.user_id);
    if (error) toast.error(error.message);
    else { toast.success("Role updated"); load(); }
  }

  async function handleApprove(user: UserRow) {
    const supabase = getSupabaseBrowserClient();
    const isPendingOfficer = (user.role as string) === "pending_officer";
    const newRole = isPendingOfficer ? "officer" : "analyst";

    const { error: upErr } = await supabase
      .from("user_profiles")
      .update({ role: newRole })
      .eq("user_id", user.user_id);
    if (upErr) { toast.error(upErr.message); return; }

    if (isPendingOfficer && user.officer_id) {
      const { error: oErr } = await supabase
        .from("officers")
        .update({ is_active: true })
        .eq("officer_id", user.officer_id);
      if (oErr) { toast.error(oErr.message); return; }
    }

    toast.success(`${user.full_name || user.email} approved as ${newRole}`);
    load();
  }

  async function handleReject(user: UserRow) {
    if (!confirm(`Reject and delete ${user.full_name || user.email}?`)) return;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("user_profiles").delete().eq("user_id", user.user_id);
    if (error) toast.error(error.message);
    else { toast.success("Registration rejected and removed"); load(); }
  }

  async function handleToggleActive(user: UserRow, active: boolean) {
    if (!user.officer_id) return;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("officers").update({ is_active: active }).eq("officer_id", user.officer_id);
    if (error) toast.error(error.message);
    else { toast.success(`Officer ${active ? "activated" : "deactivated"}`); load(); }
  }

  async function handleDelete(user: UserRow) {
    if (!confirm(`Delete ${user.full_name || user.email}? This cannot be undone.`)) return;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("user_profiles").delete().eq("user_id", user.user_id);
    if (error) toast.error(error.message);
    else { toast.success("User removed"); load(); }
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-500" /> User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage all registered users, roles, and access control.
          </p>
        </div>
        <Button onClick={load} variant="outline" className="gap-2 rounded-xl shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Users", value: stats.total, color: "text-slate-900 dark:text-white" },
          { label: "Admins", value: stats.byRole.admin ?? 0, color: "text-cyan-600 dark:text-cyan-400" },
          { label: "Officers", value: stats.byRole.officer ?? 0, color: "text-teal-600 dark:text-teal-400" },
          { label: "Analysts", value: stats.byRole.analyst ?? 0, color: "text-violet-600 dark:text-violet-400" },
          { label: "Citizens", value: stats.byRole.citizen ?? 0, color: "text-slate-600 dark:text-slate-400" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Approvals Banner */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {pendingUsers.length} Pending Approval{pendingUsers.length > 1 ? "s" : ""}
            </h2>
            <span className="text-xs text-amber-600 dark:text-amber-400">— Awaiting admin activation</span>
          </div>
          <div className="space-y-2">
            {pendingUsers.map(u => (
              <div key={u.user_id} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-lg px-4 py-3 border border-amber-100 dark:border-amber-900">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300 shrink-0">
                    {(u.full_name ?? u.email ?? "U").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.full_name || "Unnamed"}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email} · <span className="capitalize font-medium text-amber-600 dark:text-amber-400">{(u.role as string).replace("pending_", "")} registration</span></p>
                    {u.badge_number && <p className="text-xs text-slate-400">Badge: {u.badge_number} · {u.police_station}</p>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => handleApprove(u)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleReject(u)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg text-xs gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, badge, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
            suppressHydrationWarning
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={roleFilter} onValueChange={v => setRoleFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {APP_ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
          </SelectContent>
        </Select>
        <span className="hidden sm:flex items-center text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap px-2">
          {filtered.length} / {users.length} users
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-950">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">User</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Role</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest hidden md:table-cell">Details</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest hidden lg:table-cell">Joined</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest hidden lg:table-cell">Last Login</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-500 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500 dark:text-slate-400 text-sm">
                    No users found matching your filters.
                  </TableCell>
                </TableRow>
              ) : filtered.map(u => (
                <TableRow
                  key={u.user_id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  onClick={() => setSelectedUser(u)}
                >
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                        {(u.full_name ?? u.email ?? "U").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                          {u.full_name || <span className="text-slate-400 italic">No name</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{u.email ?? "—"}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell onClick={e => e.stopPropagation()}>
                    {(u.role as string).startsWith("pending_") ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        ⏳ {(u.role as string).replace("pending_", "")}
                      </span>
                    ) : (
                      <Select value={u.role} onValueChange={v => handleRoleChange(u, v as AppRole)}>
                        <SelectTrigger className={`w-28 h-7 text-[10px] font-bold uppercase border rounded-lg ${ROLE_BADGE[u.role] ?? "bg-slate-100 text-slate-600"}` }>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {APP_ROLES.map(r => <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-xs text-slate-500 dark:text-slate-400">
                    {u.badge_number && <div className="flex items-center gap-1"><Hash className="w-3 h-3" />{u.badge_number}</div>}
                    {u.mobile_number && <div className="flex items-center gap-1 mt-0.5"><UserCircle2 className="w-3 h-3" />{u.mobile_number}</div>}
                    {u.police_station && <div className="flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" />{u.police_station}</div>}
                    {!u.badge_number && !u.mobile_number && !u.police_station && <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell text-xs text-slate-500 dark:text-slate-400">
                    {new Date(u.created_at).toLocaleDateString("en-IN")}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell text-xs text-slate-500 dark:text-slate-400">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("en-IN") : <span className="text-slate-300 dark:text-slate-600">Never</span>}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right pr-6" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors outline-none">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem onClick={() => setSelectedUser(u)} className="cursor-pointer text-xs font-semibold">
                          <UserCircle2 className="w-4 h-4 mr-2" /> View / Edit
                        </DropdownMenuItem>
                        {u.role === "officer" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(u, !u.is_active)}
                              className="cursor-pointer text-xs font-semibold"
                            >
                              {u.is_active
                                ? <><UserX className="w-4 h-4 mr-2 text-amber-500" /> Deactivate</>
                                : <><UserCheck className="w-4 h-4 mr-2 text-emerald-500" /> Activate</>}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(u)}
                          className="cursor-pointer text-xs font-bold text-red-600 dark:text-red-400 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail dialog */}
      {selectedUser && (
        <UserDetailDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onRefresh={load}
        />
      )}
    </div>
  );
}
