"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, IndianRupee, Activity, Target, Loader2, ShieldAlert } from "lucide-react";
import { fetchCases, fetchAnalyticsTrends, type CaseItem } from "@/lib/api";
import { toast } from "sonner";

const COLORS = ["#0f766e", "#0369a1", "#6d28d9", "#be123c", "#ca8a04", "#16a34a"];

export default function OfficerAnalyticsPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [distribution, setDistribution] = useState<{ crime_type: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [caseData, trends] = await Promise.all([
        fetchCases({ limit: 200, sort_by: "created_at", sort_order: "desc" }),
        fetchAnalyticsTrends(),
      ]);
      setCases(caseData);
      setDistribution(trends.distribution.slice(0, 6));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const metrics = useMemo(() => {
    const resolved = cases.filter(c => ["verdict", "chargesheet"].includes(c.status)).length;
    const frozen = cases
      .filter(c => ["verdict", "chargesheet"].includes(c.status))
      .reduce((sum, c) => sum + c.financial_loss, 0);

    // Last 7 days bar chart
    const days: Record<string, { name: string; new: number; pending: number; solved: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      days[key] = { name: key, new: 0, pending: 0, solved: 0 };
    }
    cases.forEach(c => {
      const key = new Date(c.created_at).toLocaleDateString("en-US", { weekday: "short" });
      if (days[key]) {
        days[key].new += 1;
        if (["verdict", "chargesheet"].includes(c.status)) days[key].solved += 1;
        else days[key].pending += 1;
      }
    });

    return {
      total: cases.length,
      resolved,
      frozen,
      BAR_DATA: Object.values(days),
      PIE_DATA: distribution.map(d => ({ name: d.crime_type.replace(/_/g, " "), value: d.count })),
    };
  }, [cases, distribution]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Station Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live database key performance indicators.</p>
        </div>
        <Select defaultValue="7d">
          <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Complaints"
          value={metrics.total.toString()}
          trend="+4 today"
          icon={<Activity className="w-4 h-4" />}
          positive={false}
        />
        <StatCard
          title="Cases Resolved"
          value={metrics.resolved.toString()}
          trend="Good velocity"
          icon={<Target className="w-4 h-4" />}
          positive={true}
        />
        <StatCard
          title="Funds Recovered"
          value={`₹${(metrics.frozen || 0).toLocaleString("en-IN")}`}
          trend="From resolved cases"
          icon={<IndianRupee className="w-4 h-4" />}
          positive={true}
        />
        <StatCard
          title="Critical Cases"
          value={cases.filter(c => (c.severity_score ?? 0) >= 80).length.toString()}
          trend="Score ≥ 80"
          icon={<ShieldAlert className="w-4 h-4" />}
          positive={false}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Case Velocity (Last 7 Days)</CardTitle>
            <CardDescription>Inward vs outward clearance</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.BAR_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="new" name="New Cases" stackId="a" fill="#94a3b8" radius={[0, 0, 4, 4]} barSize={24} />
                <Bar dataKey="pending" name="Open" stackId="a" fill="#cbd5e1" />
                <Bar dataKey="solved" name="Resolved" stackId="a" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Category Distribution</CardTitle>
            <CardDescription>Breakdown by active cybercrime types</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center">
            {metrics.PIE_DATA.length === 0 ? (
              <div className="text-slate-400 text-sm">No categorical data available</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="65%">
                  <PieChart>
                    <Pie
                      data={metrics.PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {metrics.PIE_DATA.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full mt-2">
                  {metrics.PIE_DATA.map((entry, index) => (
                    <div key={index} className="flex items-center text-xs text-slate-600 dark:text-slate-400 truncate">
                      <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon, positive }: {
  title: string; value: string; trend: string; icon: React.ReactNode; positive: boolean;
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
          <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h2>
          <span className={`text-xs font-bold flex items-center ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
            {positive && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
