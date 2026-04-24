"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Settings,
  Users,
  Activity,
  AlertTriangle,
  CircleDollarSign,
  RefreshCw,
  Radar,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchCases, type CaseItem, updateCaseStatusInDb } from "@/lib/api";

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-800",
  classified: "bg-yellow-100 text-yellow-800",
  freeze_requested: "bg-purple-100 text-purple-800",
  assigned: "bg-cyan-100 text-cyan-800",
  investigation: "bg-orange-100 text-orange-800",
  chargesheet: "bg-green-100 text-green-800",
  verdict: "bg-gray-100 text-gray-800",
};

const statusOrder = [
  "received",
  "classified",
  "freeze_requested",
  "assigned",
  "investigation",
  "chargesheet",
  "verdict",
];

const statusLabel = (value: string) => value.replace(/_/g, " ");

export default function AdminPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState("on");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadCases = useCallback(
    async (withLoader = true) => {
      if (withLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await fetchCases({
          status: statusFilter,
          sort_by: "created_at",
          sort_order: "desc",
          limit: 100,
        });
        setCases(data);
        setLastUpdatedAt(new Date());
      } catch {
        // silent
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    void loadCases(true);
  }, [loadCases]);

  useEffect(() => {
    if (autoRefresh !== "on") return;
    const intervalId = window.setInterval(() => {
      void loadCases(false);
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [autoRefresh, loadCases]);

  async function updateStatus(caseId: string, newStatus: string) {
    try {
      const updated = await updateCaseStatusInDb(caseId, newStatus);
      if (updated) {
        toast.success(`Status updated to ${newStatus}`);
        setCases((prev) =>
          prev.map((c) => (c.id === caseId ? updated : c))
        );
      } else {
        toast.error("Update failed");
      }
    } catch {
      toast.error("Failed to update status");
    }
  }

  const totalCases = cases.length;
  const pendingCases = cases.filter((c) => c.status === "received").length;
  const escalatedCases = cases.filter((c) => c.is_escalated).length;

  const avgSeverity = useMemo(() => {
    const withSeverity = cases.filter((c) => typeof c.severity_score === "number");
    if (withSeverity.length === 0) return 0;
    const total = withSeverity.reduce((sum, c) => sum + (c.severity_score ?? 0), 0);
    return total / withSeverity.length;
  }, [cases]);

  const totalFinancialLoss = useMemo(
    () => cases.reduce((sum, c) => sum + (c.financial_loss || 0), 0),
    [cases]
  );

  const statusDistribution = useMemo(
    () =>
      statusOrder.map((status) => ({
        status: statusLabel(status),
        count: cases.filter((c) => c.status === status).length,
      })),
    [cases]
  );

  const intakeTrend = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const now = new Date();
    const buckets = new Map<string, number>();

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * dayMs);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }

    for (const c of cases) {
      const key = new Date(c.created_at).toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
    }

    return Array.from(buckets.entries()).map(([isoDate, count]) => ({
      day: isoDate.slice(5),
      cases: count,
    }));
  }, [cases]);

  const fmtNumber = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  const fmtCurrency = (n: number) => {
    if (n >= 10000000) return `INR ${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `INR ${(n / 100000).toFixed(2)} L`;
    return `INR ${fmtNumber(n)}`;
  };

  return (
    <div className="space-y-6 p-4 md:p-8 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-cyan-400 dark:to-blue-500 tracking-tight">
            <Settings className="h-8 w-8 md:h-10 md:w-10 text-primary dark:text-cyan-400 shrink-0" />
            Admin Command Center
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs mt-2 font-mono md:ml-14">
            Real-time case operations and status governance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary" className="font-mono tracking-wide">
            {refreshing ? "SYNCING" : "LIVE"}
          </Badge>
          <span className="text-muted-foreground font-mono">
            Last update: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString("en-IN") : "--:--:--"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border shadow-slate-200/50 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Users className="h-3.5 w-3.5" /> Total Cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{fmtNumber(totalCases)}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-slate-200/50 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" /> Pending Review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{fmtNumber(pendingCases)}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-slate-200/50 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono uppercase tracking-wider text-[11px] flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" /> Escalated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{fmtNumber(escalatedCases)}</p>
          </CardContent>
        </Card>

        <Card className="border shadow-slate-200/50 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono uppercase tracking-wider text-[11px] flex items-center gap-2">
              <CircleDollarSign className="h-3.5 w-3.5" /> Total Loss + Avg Severity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{fmtCurrency(totalFinancialLoss)}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg severity: {avgSeverity.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="classified">Classified</SelectItem>
              <SelectItem value="freeze_requested">Freeze Requested</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="investigation">Investigation</SelectItem>
              <SelectItem value="chargesheet">Chargesheet</SelectItem>
              <SelectItem value="verdict">Verdict</SelectItem>
            </SelectContent>
          </Select>

          <Select value={autoRefresh} onValueChange={(val) => setAutoRefresh(val ?? "on")}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Auto refresh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on">Auto: ON</SelectItem>
              <SelectItem value="off">Auto: OFF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={() => void loadCases(false)}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Now
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border shadow-slate-200/60 shadow-lg dark:shadow-none dark:border-cyan-900/30">
          <CardHeader>
            <CardTitle className="text-sm font-mono tracking-wider flex items-center gap-2">
              <Radar className="w-4 h-4" /> STATUS DISTRIBUTION
            </CardTitle>
            <CardDescription>Live count of cases grouped by workflow stage.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => [fmtNumber(value), "Cases"]} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#0284c7" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border shadow-slate-200/60 shadow-lg dark:shadow-none dark:border-cyan-900/30">
          <CardHeader>
            <CardTitle className="text-sm font-mono tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> INTAKE TREND (7 DAYS)
            </CardTitle>
            <CardDescription>Newly created cases over the last seven days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={intakeTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="intakeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => [fmtNumber(value), "Cases"]} />
                <Area
                  type="monotone"
                  dataKey="cases"
                  stroke="#06b6d4"
                  fill="url(#intakeGradient)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> All Cases (Live)
          </CardTitle>
          <CardDescription>
            Click a status dropdown to update case status. Data auto-refreshes every 15 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cases.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No cases found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Loss</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.case_number}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {c.title}
                        {c.is_escalated && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            ESC
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{c.crime_type}</TableCell>
                      <TableCell>{c.severity_score ?? "-"}</TableCell>
                      <TableCell>
                        <Select value={c.status} onValueChange={(val) => val && updateStatus(c.id, val)}>
                          <SelectTrigger className="h-8 w-44">
                            <Badge variant="secondary" className={statusColors[c.status] ?? ""}>
                              {statusLabel(c.status)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="classified">Classified</SelectItem>
                            <SelectItem value="freeze_requested">Freeze Requested</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="investigation">Investigation</SelectItem>
                            <SelectItem value="chargesheet">Chargesheet</SelectItem>
                            <SelectItem value="verdict">Verdict</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {c.financial_loss > 0 ? `${c.currency} ${c.financial_loss.toLocaleString("en-IN")}` : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
