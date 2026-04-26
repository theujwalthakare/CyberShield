"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Settings, Users, ShieldCheck, FileText,
  Activity, UserCheck, UserX, Trash2, MoreHorizontal, RefreshCw,
  Search, ShieldAlert, CircleCheck, Database, Fingerprint, Mail
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePie, Pie, Cell
} from "recharts";
import { AppRole, APP_ROLES } from "@/lib/rbac";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

// --- Types ---
type UserRow = {
  user_id: string;
  auth_subject: string;
  role: AppRole;
  email: string | null;
  full_name: string | null;
  created_at: string;
  citizen_id: string | null;
  officer_id: string | null;
  badge_number?: string | null;
  department?: string | null;
  district_code?: string | null;
  is_active?: boolean;
};

type SystemStats = {
  totalByRole: Record<string, number>;
  totalComplaints: number;
  pendingComplaints: number;
  investigatingComplaints: number;
  totalEvidenceFiles: number;
  activeAlerts: number;
};

const CHART_COLORS = ["#06b6d4", "#f43f5e", "#8b5cf6", "#10b981", "#f59e0b", "#3b82f6"];

// --- Data Fetching (Untouched Logic) ---

async function fetchUsers(): Promise<UserRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select(`user_id, auth_subject, role, email, full_name, created_at, citizen_id, officer_id, officers ( badge_number, role, district_code, is_active )`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    ...row,
    role: row.role as AppRole,
    badge_number: row.officers?.badge_number ?? null,
    department: row.officers?.role ?? null,
    district_code: row.officers?.district_code ?? null,
    is_active: row.officers?.is_active ?? true,
  }));
}

async function fetchStats(): Promise<SystemStats> {
  const supabase = getSupabaseBrowserClient();
  const [profilesRes, complaintsRes, evidenceRes, alertsRes] = await Promise.all([
    supabase.from("user_profiles").select("role"),
    supabase.from("complaints").select("status"),
    supabase.from("evidence_files").select("file_id", { count: "exact", head: true }),
    supabase.from("knowledge_base").select("kb_id", { count: "exact", head: true }),
  ]);
  const totalByRole: Record<string, number> = {};
  for (const row of profilesRes.data ?? []) {
    totalByRole[row.role] = (totalByRole[row.role] ?? 0) + 1;
  }
  const complaints: { status: string }[] = complaintsRes.data ?? [];
  return {
    totalByRole,
    totalComplaints: complaints.length,
    pendingComplaints: complaints.filter((c: { status: string }) => c.status === "RECEIVED").length,
    investigatingComplaints: complaints.filter((c: { status: string }) => c.status === "INVESTIGATION").length,
    totalEvidenceFiles: evidenceRes.count ?? 0,
    activeAlerts: alertsRes.count ?? 0,
  };
}

// --- Sub-components ---

function UserActions({ user, onToggleActive, onDelete }: {
  user: UserRow;
  onToggleActive: (user: UserRow, active: boolean) => void;
  onDelete: (user: UserRow) => void;
}) {
  const isOfficer = user.role === "officer";
  const active = user.is_active ?? true;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none">
        <MoreHorizontal className="h-4 w-4 text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl border-none">
        {isOfficer && (
          <DropdownMenuItem onClick={() => onToggleActive(user, !active)} className="cursor-pointer font-bold text-xs">
            {active ? <UserX className="mr-2 h-4 w-4 text-rose-500" /> : <UserCheck className="mr-2 h-4 w-4 text-emerald-500" />}
            {active ? "Deactivate Officer" : "Activate Officer"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onDelete(user)} className="cursor-pointer text-rose-600 font-bold text-xs">
          <Trash2 className="mr-2 h-4 w-4" /> Terminate Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Main Page ---

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([fetchUsers(), fetchStats()]);
      setUsers(u);
      setStats(s);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const filteredUsers = useMemo(() => 
    users.filter(u => 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [users, searchQuery]);

  const pendingApprovals = users.filter(u => u.role === "officer" && !u.is_active);

  // --- Backend Action Wrappers ---
  const handleUpdateRole = async (user: UserRow, role: AppRole) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("user_profiles").update({ role }).eq("user_id", user.user_id);
    if (error) toast.error(error.message);
    else { toast.success("Role updated"); loadAll(); }
  };

  const handleToggleActive = async (user: UserRow, active: boolean) => {
    if (!user.officer_id) return;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("officers").update({ is_active: active }).eq("officer_id", user.officer_id);
    if (error) toast.error(error.message);
    else { toast.success(`Officer ${active ? "activated" : "deactivated"}`); loadAll(); }
  };

  const handleDeleteUser = async (user: UserRow) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("user_profiles").delete().eq("user_id", user.user_id);
    if (error) toast.error(error.message);
    else { toast.success("User removed"); loadAll(); }
  };

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] dark:bg-black text-slate-900 dark:text-white flex flex-col">
      <main className="w-full max-w-[1440px] mx-auto px-6 py-10 flex flex-col gap-10">
        
        {/* Header Section */}
        <header className="w-full text-left">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8" />
            Admin Command Center
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-2">
            Live Threat Telemetry & User Provisioning
          </p>
        </header>

        <Tabs defaultValue="stats" className="w-full flex flex-col gap-8">
          
          {/* Search and Tabs Row */}
          <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="relative w-full lg:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
              <Input 
                placeholder="Search entities, emails, or IDs..." 
                className="pl-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl h-12 w-full focus-visible:ring-1 focus-visible:ring-cyan-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                suppressHydrationWarning
              />
            </div>

            <TabsList className="bg-slate-200/50 dark:bg-slate-900 rounded-xl h-12 p-1 border-none shadow-sm">
              <TabsTrigger value="stats" className="px-8 font-bold text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Telemetry</TabsTrigger>
              <TabsTrigger value="users" className="px-8 font-bold text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Directory</TabsTrigger>
              <TabsTrigger value="approvals" className="px-8 font-bold text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 relative">
                Approvals {pendingApprovals.length > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 bg-rose-500 rounded-full animate-pulse border-2 border-[#F9FAFB] dark:border-black" />}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Stats / Telemetry Tab */}
          <TabsContent value="stats" className="w-full flex flex-col gap-6 m-0 outline-none">
            {loading || !stats ? (
              <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">Syncing Matrix...</p>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-6">
                {/* KPI Cards */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><ShieldAlert className="h-3 w-3" /> Total Incidents</p>
                    <p className="text-3xl font-bold tracking-tight">{stats.totalComplaints}</p>
                  </Card>
                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><Fingerprint className="h-3 w-3" /> Active Roles</p>
                    <p className="text-3xl font-bold tracking-tight text-cyan-500">{Object.keys(stats.totalByRole).length}</p>
                  </Card>
                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><Database className="h-3 w-3" /> Evidence Files</p>
                    <p className="text-3xl font-bold tracking-tight text-rose-500">{stats.totalEvidenceFiles}</p>
                  </Card>
                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><Activity className="h-3 w-3" /> Alerts Logged</p>
                    <p className="text-3xl font-bold tracking-tight text-amber-500">{stats.activeAlerts}</p>
                  </Card>
                </div>

                {/* Registration Trends Chart */}
                <Card className="w-full border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                  <CardHeader className="px-8 pt-8">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live User Activity (Registration Trends)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[380px] w-full px-4 pb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={users.slice(0, 20).reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="created_at" hide />
                        <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="user_id" name="Registrations" stroke="#06b6d4" strokeWidth={3} fill="url(#areaGrad)" />
                        <Area type="monotone" dataKey="role" stroke="#f43f5e" strokeWidth={2} fill="transparent" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bottom Row Distributions */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-none shadow-sm h-80 bg-white dark:bg-slate-900/50 p-6 flex flex-col">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Subject Distribution</CardTitle>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(stats.totalByRole).map(([name, value]) => ({ name, value }))}>
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {Object.entries(stats.totalByRole).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card className="border-none shadow-sm h-80 bg-white dark:bg-slate-900/50 p-6 flex flex-col">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Access Proportion</CardTitle>
                    <ResponsiveContainer width="100%" height="100%">
                      <RePie>
                        <Pie data={Object.entries(stats.totalByRole).map(([name, value]) => ({ name, value }))} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                          {Object.entries(stats.totalByRole).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </RePie>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Directory Tab */}
          <TabsContent value="users" className="w-full m-0 outline-none">
            <Card className="w-full border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-950">
                  <TableRow>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-8">Subject Profile</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">System Role</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.user_id} className="border-slate-100 dark:border-slate-800 group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <TableCell className="pl-8 py-4">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{u.full_name || "N/A"}</div>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1"><Mail className="h-2 w-2" /> {u.email}</div>
                      </TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={(v) => handleUpdateRole(u, v as AppRole)}>
                          <SelectTrigger className="w-32 h-8 text-[10px] font-bold uppercase border-none bg-slate-100 dark:bg-slate-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {APP_ROLES.map(r => <SelectItem key={r} value={r} className="text-xs uppercase font-bold">{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-1.5 w-1.5 rounded-full", u.is_active ? "bg-cyan-500 shadow-[0_0_8px_cyan]" : "bg-slate-300")} />
                          <span className="text-[10px] font-bold uppercase">{u.is_active ? "Verified" : "Locked"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <UserActions user={u} onToggleActive={handleToggleActive} onDelete={handleDeleteUser} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="w-full m-0 outline-none">
             <Card className="w-full border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 min-h-[400px] flex items-center justify-center">
                {pendingApprovals.length === 0 ? (
                  <div className="text-center flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                      <CircleCheck className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Queue Clear / No Pending Entities</p>
                  </div>
                ) : (
                  <Table className="w-full">
                     <TableBody>
                        {pendingApprovals.map(officer => (
                           <TableRow key={officer.user_id} className="border-slate-50 dark:border-slate-800">
                              <TableCell className="pl-8 py-6">
                                <div className="font-bold text-slate-900 dark:text-slate-100">{officer.full_name}</div>
                                <div className="text-[10px] text-slate-400">{officer.email}</div>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" onClick={() => handleToggleActive(officer, true)} className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white border-none font-bold text-[10px] uppercase">Approve</Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(officer)} className="text-rose-500 font-bold text-[10px] uppercase">Reject</Button>
                                </div>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
                )}
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
