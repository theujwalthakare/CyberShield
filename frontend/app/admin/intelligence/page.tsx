"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Database, ShieldAlert, CheckCircle, TrendingUp, MapPin, Filter, Map as MapIcon, PieChart as PieChartIcon, Target, Activity, Info } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Line
} from "recharts";
import {
  fetchIntelligenceOverview,
  fetchIntelligenceTrends,
  fetchIntelligenceDistribution,
  fetchIntelligenceCategoryDistribution,
  fetchIntelligenceDailyDistribution,
  fetchIntelligenceGeography,
  fetchIntelligenceForecast,
  fetchIntelligenceRisk,
  fetchIntelligenceFilters,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";

// Dynamically load the IntelligenceMap with SSR disabled
const IntelligenceMap = dynamic(() => import("@/components/intelligence-map"), { ssr: false, loading: () => <div className="h-[400px] w-full bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" /> });

interface OverviewData { total_cases: number; total_financial_loss: number; avg_loss_per_case: number; impacted_sectors: number; }
interface TrendData { Year: number; Cases_Reported: number; Financial_Loss: number; }
interface DistributionData { crime_type: string; count: number; }
interface DailyData { day: number; count: number; }
interface CategoryDistData { category: string; count: number; }
interface GeographyData { state: string; total_cases: number; total_financial_loss: number; }
interface FiltersResponse { years: number[]; states: string[]; crime_types: string[]; categories: string[]; }
interface ForecastData { Year: number; Cases_Reported: number; Financial_Loss: number; is_forecast: boolean; Cases_Predicted_Lower?: number; Cases_Predicted_Upper?: number; }
interface RiskData { State: string; surge_velocity: number; projected_cases: number; }

const PIE_COLORS = ["#06b6d4", "#f43f5e"]; // Cyan, Rose
const PIE_COLORS_DARK = ["#0284c7", "#e11d48"];

export default function IntelligenceDashboard() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const [loading, setLoading] = useState(true);
  const [filterData, setFilterData] = useState<FiltersResponse>({ years: [], states: [], crime_types: [], categories: [] });
  
  const [filterYear, setFilterYear] = useState<string>("All");
  const [filterState, setFilterState] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [distribution, setDistribution] = useState<DistributionData[]>([]);
  const [dailyDist, setDailyDist] = useState<DailyData[]>([]);
  const [categoryDist, setCategoryDist] = useState<CategoryDistData[]>([]);
  const [geography, setGeography] = useState<GeographyData[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [risks, setRisks] = useState<RiskData[]>([]);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchIntelligenceFilters().then(setFilterData).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const filters = {
      year: filterYear,
      state: filterState,
      crime_type: filterType,
      category: filterCategory,
    };

    try {
      const [o, t, d, dy, cd, g, f, r] = await Promise.all([
        fetchIntelligenceOverview(filters),
        fetchIntelligenceTrends(filters),
        fetchIntelligenceDistribution(filters),
        fetchIntelligenceDailyDistribution(filters),
        fetchIntelligenceCategoryDistribution(filters),
        fetchIntelligenceGeography(filters),
        fetchIntelligenceForecast(),
        fetchIntelligenceRisk(),
      ]);
      setOverview(o);
      setTrends(t);
      setDistribution(d);
      setDailyDist(dy);
      setCategoryDist(cd);
      setGeography(g);
      setForecast(f);
      setRisks(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterState, filterType, filterCategory]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const channel = supabase
      .channel("intelligence-reports-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "intelligence_reports" },
        () => {
          // Debounce rapid events so we avoid spamming the dashboard queries.
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
          }

          refreshTimerRef.current = setTimeout(() => {
            void loadData();
            void fetchIntelligenceFilters().then(setFilterData).catch(() => {});
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [loadData]);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
  const fmtCurr = (n: number) => {
    if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`;
    if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`;
    if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`;
    return `₹${n.toFixed(0)}`;
  };

  // Process forecast data to separate historic and predicted lines properly
  const formattedForecast = forecast.map((d, i, arr) => {
    if (d.is_forecast) {
      return { 
        ...d, 
        Cases_Predicted: d.Cases_Reported,
        confidence_band: [d.Cases_Predicted_Lower, d.Cases_Predicted_Upper]
      };
    }
    const isLastHistorical = !d.is_forecast && arr[i + 1]?.is_forecast;
    return { 
      ...d, 
      Cases_Actual: d.Cases_Reported, 
      Cases_Predicted: isLastHistorical ? d.Cases_Reported : null,
      confidence_band: isLastHistorical ? [d.Cases_Reported, d.Cases_Reported] : null
    };
  });

  const catPieData = categoryDist.map(c => ({ name: c.category, value: c.count }));

  const latestHistorical = formattedForecast.find((d, i, arr) => !d.is_forecast && (!arr[i + 1] || arr[i + 1].is_forecast));
  const finalPrediction = formattedForecast[formattedForecast.length - 1];
  const actualCases = latestHistorical ? (latestHistorical as any).Cases_Actual : 0;
  const growthRate = latestHistorical && finalPrediction && actualCases > 0
    ? ((((finalPrediction.Cases_Predicted as number) - actualCases) / actualCases) * 100).toFixed(1)
    : "0";
  const isSurging = parseFloat(growthRate) > 0;

  return (
    <div className="space-y-6 p-4 md:p-8 pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-cyan-400 dark:via-cyan-200 dark:to-blue-500 tracking-tight">
            <Database className="h-8 w-8 md:h-10 md:w-10 text-primary dark:text-cyan-400 shrink-0 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" /> 
            Intelligence Center
          </h1>
          <p className="text-muted-foreground dark:text-cyan-400/80 uppercase tracking-widest text-xs mt-2 font-mono md:ml-14">
            Macro Level Threat Analysis (2020 - 2024)
          </p>
        </div>

        {/* Floating Slicers Panel */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-cyan-900 shadow-xl shadow-slate-200/50 dark:shadow-[0_0_25px_rgba(6,182,212,0.15)] w-full xl:w-auto relative z-[60]">
            <div className="flex items-center justify-center gap-2 px-3 border-b sm:border-b-0 sm:border-r border-slate-300 dark:border-slate-700 pb-2 sm:pb-0 w-full sm:w-auto">
                <Filter className="w-5 h-5 text-slate-800 dark:text-cyan-400" />
                <span className="text-sm font-mono font-bold text-slate-800 dark:text-cyan-400 uppercase tracking-wider pr-1">Slicers</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-center flex-wrap sm:flex-nowrap">
                <Select value={filterYear} onValueChange={(v) => setFilterYear(v || "All")}>
                    <SelectTrigger className="w-[120px] !bg-slate-50 dark:!bg-slate-950 border-slate-300 dark:border-slate-800 focus:ring-cyan-500 font-bold text-slate-800 dark:text-slate-200">
                        <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="!bg-white dark:!bg-slate-950 border-slate-300 dark:border-slate-700 z-[70] shadow-xl">
                        <SelectItem value="All" className="font-bold">All Years</SelectItem>
                        {filterData.years.map(y => <SelectItem key={y} value={y.toString()} className="font-medium">{y}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterState} onValueChange={(v) => setFilterState(v || "All")}>
                    <SelectTrigger className="w-[160px] !bg-slate-50 dark:!bg-slate-950 border-slate-300 dark:border-slate-800 focus:ring-cyan-500 font-bold text-slate-800 dark:text-slate-200 truncate">
                        <SelectValue placeholder="All Regions" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="!bg-white dark:!bg-slate-950 border-slate-300 dark:border-slate-700 z-[70] shadow-xl max-h-[300px]">
                        <SelectItem value="All" className="font-bold">All Regions</SelectItem>
                        {filterData.states.map(s => <SelectItem key={s} value={s} className="font-medium">{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={(v) => setFilterType(v || "All")}>
                    <SelectTrigger className="w-[160px] sm:w-[180px] !bg-slate-50 dark:!bg-slate-950 border-slate-300 dark:border-slate-800 focus:ring-cyan-500 font-bold text-slate-800 dark:text-slate-200 truncate">
                        <SelectValue placeholder="All Threats" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="!bg-white dark:!bg-slate-950 border-slate-300 dark:border-slate-700 z-[70] shadow-xl max-h-[300px]">
                        <SelectItem value="All" className="font-bold">All Threats</SelectItem>
                        {filterData.crime_types.map(c => <SelectItem key={c} value={c} className="font-medium">{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v || "All")}>
                    <SelectTrigger className="w-[160px] sm:w-[180px] !bg-slate-50 dark:!bg-slate-950 border-slate-300 dark:border-slate-800 focus:ring-cyan-500 font-bold text-slate-800 dark:text-slate-200 truncate">
                        <SelectValue placeholder="All Sectors" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="!bg-white dark:!bg-slate-950 border-slate-300 dark:border-slate-700 z-[70] shadow-xl max-h-[300px]">
                        <SelectItem value="All" className="font-bold">All Sectors</SelectItem>
                        {filterData.categories?.map(c => <SelectItem key={c} value={c} className="font-medium">{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40 flex-col gap-6 animate-in fade-in zoom-in duration-500">
          <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          <p className="text-slate-500 dark:text-cyan-500/70 font-mono text-sm animate-pulse tracking-[0.3em] font-medium uppercase">Processing Tensor Cube...</p>
        </div>
      ) : (
      <div className="space-y-6">
      {/* 1. KPIs Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-slate-200/50 shadow-md dark:shadow-none dark:glass-panel dark:border-cyan-900/40 relative overflow-hidden group animate-in zoom-in-95 fade-in duration-500 delay-75 fill-mode-both hover:-translate-y-1 transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 dark:from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 dark:text-cyan-400/80 font-mono text-[11px] font-bold tracking-widest uppercase flex items-center gap-2">
               <ShieldAlert className="h-3.5 w-3.5 text-primary dark:text-cyan-400" /> Total Incidents
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 pb-4">
            <p className="text-2xl lg:text-3xl xl:text-3xl font-extrabold text-slate-900 dark:text-cyan-50 dark:drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">
              {fmt(overview?.total_cases ?? 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border shadow-slate-200/50 shadow-md dark:shadow-none dark:glass-panel dark:border-emerald-900/50 relative overflow-hidden group animate-in zoom-in-95 fade-in duration-500 delay-150 fill-mode-both hover:-translate-y-1 transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 dark:from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 dark:text-emerald-400/80 font-mono text-[11px] font-bold tracking-widest uppercase flex items-center gap-2">
               <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Total Financial Loss
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 pb-4">
            <p className="text-2xl lg:text-3xl xl:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 dark:drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]">
              {fmtCurr(overview?.total_financial_loss ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-slate-200/50 shadow-md dark:shadow-none dark:glass-panel dark:border-rose-900/50 relative overflow-hidden group animate-in zoom-in-95 fade-in duration-500 delay-200 fill-mode-both hover:-translate-y-1 transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 dark:from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 dark:text-rose-400/80 font-mono text-[11px] font-bold tracking-widest uppercase flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> Average Loss / Case
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 pb-4">
            <p className="text-2xl lg:text-3xl xl:text-3xl font-extrabold text-rose-600 dark:text-rose-400 dark:drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]">
              {fmtCurr(overview?.avg_loss_per_case ?? 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border shadow-slate-200/50 shadow-md dark:shadow-none dark:glass-panel dark:border-amber-900/50 relative overflow-hidden group animate-in zoom-in-95 fade-in duration-500 delay-300 fill-mode-both hover:-translate-y-1 transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 dark:from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 dark:text-amber-400/80 font-mono text-[11px] font-bold tracking-widest uppercase flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Impacted Sectors
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 pb-4">
            <p className="text-2xl lg:text-3xl xl:text-3xl font-extrabold text-amber-600 dark:text-amber-400 dark:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              {overview?.impacted_sectors ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Map Visual Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Threat Map Visual */}
        <Card className="lg:col-span-2 border shadow-slate-200/60 shadow-lg dark:shadow-none dark:glass-panel dark:border-cyan-900/40 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300 fill-mode-both">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
            <CardTitle className="text-slate-800 dark:text-cyan-400 tracking-wider text-sm font-mono flex gap-2 items-center">
              <MapIcon className="h-4 w-4"/> REGIONAL IMPACT HOTSPOTS
            </CardTitle>
            <CardDescription>Mappls (MapmyIndia) visualization of aggregated regional intelligence markers across targeted cities.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-xl relative h-[450px] lg:h-auto">
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.2)] dark:shadow-[inset_0_0_50px_rgba(6,182,212,0.1)] z-10" />
              <IntelligenceMap geography={geography} />
          </CardContent>
        </Card>

        {/* Sector Category Pie Chart */}
        <Card className="border shadow-slate-200/60 shadow-lg dark:shadow-none dark:glass-panel dark:border-cyan-900/40 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-400 fill-mode-both flex flex-col">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
            <CardTitle className="text-slate-800 dark:text-cyan-400 tracking-wider text-sm font-mono flex gap-2 items-center">
              <PieChartIcon className="h-4 w-4"/> TARGET SECTOR VULNERABILITY
            </CardTitle>
            <CardDescription>Proportional breakdown of cyber incidents by industry category.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-0 pb-6 relative group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={catPieData}
                    cx="50%"
                    cy="55%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {catPieData.map((entry, i) => {
                      const colors = isDark ? ["#0ea5e9", "#8b5cf6", "#d946ef", "#ec4899", "#f43f5e", "#f59e0b"] : ["#0284c7", "#6d28d9", "#c026d3", "#db2777", "#e11d48", "#d97706"];
                      return <Cell key={`cell-${i}`} fill={colors[i % colors.length]} className="drop-shadow-sm hover:opacity-80 transition-opacity" />
                    })}
                  </Pie>
                  <Tooltip 
                     cursor={{fill: isDark ? '#1e293b' : '#f1f5f9'}} 
                     contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                     formatter={(value: number, name: string) => [fmt(value), name]}
                     itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}/>
                </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 3. Temporal Analysis Row */}
      <div className="grid gap-6 lg:grid-cols-1">
        <Card className="border shadow-slate-200/60 shadow-lg dark:shadow-none dark:glass-panel dark:border-cyan-900/40 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500 fill-mode-both">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
            <CardTitle className="text-slate-800 dark:text-cyan-400 tracking-wider text-sm font-mono flex gap-2 items-center">
              <Activity className="h-4 w-4"/> TEMPORAL CYBER EVENTS (DAILY SPREAD)
            </CardTitle>
            <CardDescription>Aggregate cyber incident frequency mapped exclusively by the day of the month.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dailyDist} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke={isDark ? "#475569" : "#94a3b8"} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={isDark ? "#475569" : "#94a3b8"} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
                <Tooltip 
                  cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }}
                  contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '12px' }}
                  labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}
                  itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 500 }}
                  labelFormatter={(label) => `Day ${label} of Month`}
                  formatter={(value: number) => [fmt(value), "Incidents"]}
                />
                <Bar dataKey="count" name="Reported Incidents" fill={isDark ? "#06b6d4" : "#0284c7"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 3. Trend and Distribution Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border shadow-slate-200/60 shadow-lg dark:shadow-none dark:glass-panel dark:border-cyan-900/30 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500 fill-mode-both">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-cyan-400 tracking-wider text-sm font-mono flex items-center gap-2">
                <Database className="w-4 h-4"/> 5-YEAR MACRO TREND VELOCITY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={trends} margin={{ top: 15, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#f43f5e" : "#e11d48"} stopOpacity={isDark ? 0.3 : 0.2}/>
                    <stop offset="95%" stopColor={isDark ? "#f43f5e" : "#e11d48"} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConvicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#06b6d4" : "#0284c7"} stopOpacity={isDark ? 0.4 : 0.3}/>
                    <stop offset="95%" stopColor={isDark ? "#06b6d4" : "#0284c7"} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="Year" stroke={isDark ? "#475569" : "#94a3b8"} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis 
                    stroke={isDark ? "#475569" : "#94a3b8"} 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} 
                />
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
                <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 500 }}
                    formatter={(value: number) => [fmt(value)]}
                    labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: "bold", paddingBottom: "4px" }}
                />
                <Area type="monotone" name="Cases Reported" dataKey="Cases_Reported" stroke={isDark ? "#f43f5e" : "#e11d48"} strokeWidth={3} fillOpacity={1} fill="url(#colorReported)" />
                <Area type="monotone" name="Convictions" dataKey="Convictions" stroke={isDark ? "#06b6d4" : "#0284c7"} strokeWidth={3} fillOpacity={1} fill="url(#colorConvicted)" />
                </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="border shadow-slate-200/60 shadow-lg dark:shadow-none dark:glass-panel dark:border-cyan-900/30 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-600 fill-mode-both">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-cyan-400 tracking-wider text-sm font-mono flex items-center gap-2">
                <Filter className="w-4 h-4"/> TOP CATEGORICAL DISTRIBUTIONS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={distribution} layout="vertical" margin={{ top: 15, right: 30, left: 40, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="crime_type" type="category" width={100} fontSize={11} tick={{ fill: isDark ? "#cbd5e1" : "#475569", fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <Tooltip 
                     cursor={{fill: isDark ? '#1e293b' : '#f1f5f9'}} 
                     contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                     formatter={(value: number) => [fmt(value), "Cases Recorded"]}
                     labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}
                     itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 500 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} fill={isDark ? "#8b5cf6" : "#6366f1"} barSize={24} className="hover:opacity-80 transition-opacity" />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* 4. Predictive Intelligence Row (Machine Learning) */}
      <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-orange-500 dark:from-rose-400 dark:to-orange-400 tracking-tight pt-8 pb-3">
         <Target className="h-6 w-6 text-rose-500 dark:text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" /> 
         Predictive Threat Matrix (2025-2028 Forecast)
      </h2>

      <div className="mb-6 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
        <Card className="border shadow-blue-200/50 shadow-md dark:shadow-none bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/40">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
               <div className="p-2 sm:p-3 rounded-full bg-blue-100 dark:bg-blue-900/40 shrink-0">
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
               </div>
               <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-base sm:text-lg">AI Prediction Summary</h4>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Based on crime data from the last 5 years (2020-2024), our AI predicts that overall incidents will 
                    <strong className={isSurging ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                      {' '}{isSurging ? "increase" : "decrease"} by {Math.abs(parseFloat(growthRate))}%
                    </strong> by {finalPrediction?.Year || 2028}.
                    {isSurging ? " Since cases are rising, law enforcement should urgently focus resources on the high-risk 'Surge Regions' listed below to prevent future spikes." : " Since cases are projected to drop, current security measures and awareness campaigns appear to be working successfully!"}
                  </p>
               </div>
            </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Forecast Chart */}
        <Card className="lg:col-span-2 border shadow-rose-200/50 shadow-lg dark:shadow-none dark:glass-panel dark:border-rose-900/40 relative overflow-hidden group animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500 fill-mode-both">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10 dark:opacity-20 pointer-events-none" />
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
            <CardTitle className="text-slate-800 dark:text-rose-400 tracking-wider text-sm font-mono flex gap-2 items-center">
              <Activity className="h-4 w-4"/> MACHINE LEARNING REGRESSION MODEL
            </CardTitle>
            <CardDescription>AI-generated projections based on 5-year historical trajectory vectors.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={formattedForecast} margin={{ top: 15, right: 30, left: 20, bottom: 0 }}>
                <defs>
                   <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor={isDark ? "#3b82f6" : "#2563eb"} stopOpacity={isDark ? 0.3 : 0.2}/>
                     <stop offset="95%" stopColor={isDark ? "#3b82f6" : "#2563eb"} stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <XAxis dataKey="Year" stroke={isDark ? "#475569" : "#94a3b8"} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={isDark ? "#475569" : "#94a3b8"} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: "bold", paddingBottom: "4px" }}
                  formatter={(value: number, name: string) => [fmt(value), name.replace("_", " ")]}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}/>
                {/* Historical Area */}
                <Area type="monotone" name="Historical Actuals" dataKey="Cases_Actual" stroke={isDark ? "#3b82f6" : "#2563eb"} fillOpacity={1} fill="url(#colorActual)" strokeWidth={3} />
                {/* 95% Confidence Interval */}
                <Area type="monotone" name="95% Confidence Bound" dataKey="confidence_band" stroke="none" fill={isDark ? "#f43f5e" : "#e11d48"} fillOpacity={0.12} />
                {/* Predicted Line */}
                <Line type="monotone" name="Predicted Trajectory" dataKey="Cases_Predicted" stroke={isDark ? "#f43f5e" : "#e11d48"} strokeWidth={3} strokeDasharray="6 6" dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* High Risk Targets */}
        <Card className="border shadow-orange-200/50 shadow-lg dark:shadow-none dark:glass-panel dark:border-orange-900/40 relative overflow-hidden group animate-in slide-in-from-bottom-8 fade-in duration-700 delay-700 fill-mode-both">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
            <CardTitle className="text-slate-800 dark:text-orange-400 tracking-wider text-sm font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4"/> SEVERE SURGE REGIONS
            </CardTitle>
            <CardDescription>Top highest-velocity growth areas projected for 2028.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2 lg:p-6 lg:pt-6">
             <div className="flex flex-col gap-4 px-4 pb-4 lg:p-0">
               {risks.length === 0 ? (
                  <p className="text-slate-500 text-sm mt-4 text-center">No extreme risk data available for current filter.</p>
               ) : (
                 (() => {
                   const maxVelocity = Math.max(...risks.map(r => r.surge_velocity));
                   return risks.map((risk, idx) => (
                     <div key={risk.State} className="group relative flex flex-col gap-2.5 p-3 sm:p-5 rounded-xl bg-orange-50/50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/20 transition-colors hover:bg-orange-50 dark:hover:bg-orange-500/10 shadow-sm shadow-orange-100/50 dark:shadow-none">
                       <div className="flex items-center justify-between mb-0.5">
                         <div className="flex items-center gap-2 sm:gap-3 truncate pr-2">
                            <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded bg-orange-200 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400 font-extrabold text-[10px] sm:text-xs shrink-0 shadow-inner">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 truncate">{risk.State}</span>
                         </div>
                         <div className="text-right shrink-0">
                            <span className="font-mono text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 drop-shadow-sm">+{fmt(risk.surge_velocity)} / yr</span>
                         </div>
                       </div>
                       
                       {/* Velocity Progress Bar */}
                       <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-1.5 sm:h-2 overflow-hidden border border-slate-300/50 dark:border-slate-700/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] relative">
                         <div 
                           className="bg-gradient-to-r from-orange-400 via-rose-500 to-rose-600 h-full rounded-full transition-all duration-1000 ease-out relative" 
                           style={{ width: `${Math.max(5, (risk.surge_velocity / maxVelocity) * 100)}%` }} 
                         >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                         </div>
                       </div>
                       
                       {/* Subtext info */}
                       <div className="flex justify-between items-center opacity-70 mt-0.5">
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Relative Growth Velocity</span>
                          <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Proj. 2024: <strong className="text-slate-800 dark:text-slate-200 font-extrabold text-[11px] sm:text-[13px]">{fmt(risk.projected_cases)}</strong></span>
                       </div>
                     </div>
                   ));
                 })()
               )}
             </div>
          </CardContent>
        </Card>
      </div>
      </div>
      )}
    </div>
  );
}
