"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, IndianRupee, TrendingUp, BarChart3, Activity, ShieldAlert } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  CartesianGrid
} from "recharts";
import { fetchAnalyticsTrends, fetchAnalyticsLossSummary } from "@/lib/api";

interface TrendsData {
  summary: {
    total_incidents: number;
    top_crime_type: string;
    loss_amount: number;
  };
  distribution: { crime_type: string; count: number }[];
}

interface LossSummary {
  total_loss: number;
  avg_loss: number;
  max_loss: number;
}

const COLORS = [
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
];

const threatTimeline = [
  { time: "00:00", threats: 12, blocked: 10 },
  { time: "04:00", threats: 45, blocked: 41 },
  { time: "08:00", threats: 88, blocked: 80 },
  { time: "12:00", threats: 156, blocked: 140 },
  { time: "16:00", threats: 210, blocked: 205 },
  { time: "20:00", threats: 164, blocked: 150 },
  { time: "24:00", threats: 42, blocked: 40 },
];

export default function AnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loss, setLoss] = useState<LossSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [trendsData, lossData] = await Promise.all([
          fetchAnalyticsTrends(),
          fetchAnalyticsLossSummary(),
        ]);
        setTrends(trendsData);
        setLoss(lossData);
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-cyan-500" />
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-cyan-50">
          <Activity className="h-8 w-8 text-primary dark:text-cyan-400" /> Analyst Command Center
        </h1>
        <p className="text-muted-foreground dark:text-cyan-400/70 uppercase tracking-widest text-xs mt-1 font-mono">
          Live Threat Telemetry & Financial Impact
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-sm dark:glass-panel dark:border-cyan-900/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 dark:from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground dark:text-cyan-400/70 font-mono text-xs uppercase flex items-center gap-2">
               <ShieldAlert className="h-3 w-3" /> Total Incidents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-slate-900 dark:text-cyan-50">
              {trends?.summary.total_incidents ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm dark:glass-panel dark:border-cyan-900/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 dark:from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground dark:text-cyan-400/70 font-mono text-xs uppercase flex items-center gap-2">
               <BarChart3 className="h-3 w-3" /> Top Crime Vector
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900 dark:text-cyan-50 capitalize truncate">
              {trends?.summary.top_crime_type ?? "Monitoring..."}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm dark:glass-panel dark:border-cyan-900/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 dark:from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground dark:text-cyan-400/70 font-mono text-xs uppercase flex items-center gap-2">
              <IndianRupee className="h-3 w-3" /> System Total Loss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">₹{fmt(loss?.total_loss ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm dark:glass-panel dark:border-cyan-900/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 dark:from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground dark:text-cyan-400/70 font-mono text-xs uppercase flex items-center gap-2">
              <TrendingUp className="h-3 w-3" /> Avg Impact Severity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">₹{fmt(loss?.avg_loss ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Threat Timeline Chart */}
      <Card className="border shadow-sm dark:glass-panel dark:border-cyan-900/30">
        <CardHeader>
          <CardTitle className="text-primary dark:text-cyan-400 tracking-wider text-sm font-mono flex gap-2"><Activity className="h-4 w-4"/>LIVE THREAT VOLUME (24H)</CardTitle>
        </CardHeader>
        <CardContent>
           <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={threatTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={isDark ? 0.3 : 0.6}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke={isDark ? "#475569" : "#94a3b8"} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={isDark ? "#475569" : "#94a3b8"} fontSize={12} tickLine={false} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
              <Tooltip 
                 contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '8px' }}
                 itemStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
              />
              <Area type="monotone" dataKey="threats" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" />
              <Area type="monotone" dataKey="blocked" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorBlocked)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribution Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border shadow-sm dark:glass-panel dark:border-cyan-900/30">
          <CardHeader>
            <CardTitle className="text-primary dark:text-cyan-400 tracking-wider text-sm font-mono">VECTOR DISTRIBUTION</CardTitle>
          </CardHeader>
          <CardContent>
            {!trends?.distribution?.length ? (
              <p className="py-8 text-center text-slate-500 font-mono text-sm">AWAITING TELEMETRY</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trends.distribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="crime_type"
                    fontSize={11}
                    tick={{ fill: "#64748b" }}
                    tickLine={false} axisLine={false}
                  />
                  <YAxis fontSize={11} tick={{ fill: "#64748b" }} tickLine={false} axisLine={false}/>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
                  <Tooltip cursor={{fill: isDark ? '#1e293b' : '#f1f5f9'}} contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '8px' }}/>
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {trends.distribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm dark:glass-panel dark:border-cyan-900/30">
          <CardHeader>
            <CardTitle className="text-primary dark:text-cyan-400 tracking-wider text-sm font-mono">VECTOR PROPORTION</CardTitle>
          </CardHeader>
          <CardContent>
            {!trends?.distribution?.length ? (
              <p className="py-8 text-center text-slate-500 font-mono text-sm">AWAITING TELEMETRY</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={trends.distribution}
                    dataKey="count"
                    nameKey="crime_type"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    label={({ crime_type }) => crime_type}
                  >
                    {trends.distribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '8px' }}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
