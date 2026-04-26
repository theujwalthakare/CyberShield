'use client';

import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, ArrowDownRight, IndianRupee, Activity, Target, Loader2 } from 'lucide-react';
import { useCases } from '@/hooks/use-data';

const COLORS = ['#0f766e', '#0369a1', '#6d28d9', '#be123c', '#ca8a04', '#16a34a'];

export default function AnalyticsDashboardPage() {
  const { data: casesResponse, isLoading } = useCases();
  const cases = (casesResponse?.data as any[]) || [];

  const metrics = useMemo(() => {
    let resolved = 0;
    let frozen = 0;
    const categoryCounts: Record<string, number> = {};
    const days: Record<string, { new: number, pending: number, solved: number }> = {};

    // Initialize last 7 days for the bar chart
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      days[dayName] = { new: 0, pending: 0, solved: 0 };
    }

    cases.forEach(c => {
      // General metrics
      if (['VERDICT', 'CHARGESHEET'].includes(c.status)) resolved++;
      if (c.freezeStatus === 'FROZEN') frozen += (c.financialLossAmount || 0);

      // Pie chart categories
      const cat = c.crimeCategory?.replace(/_/g, ' ') || 'OTHER';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      // Bar chart timelines
      if (c.submittedAt) {
        const dateString = new Date(c.submittedAt).toLocaleDateString('en-US', { weekday: 'short' });
        if (days[dateString]) {
           days[dateString].new += 1;
           if (['VERDICT', 'CHARGESHEET'].includes(c.status)) {
              days[dateString].solved += 1;
           } else {
              days[dateString].pending += 1;
           }
        }
      }
    });

    const PIE_DATA = Object.entries(categoryCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 6);
    const BAR_DATA = Object.entries(days).map(([name, data]) => ({ name, ...data }));

    return {
      total: cases.length,
      resolved,
      frozen,
      PIE_DATA,
      BAR_DATA
    };
  }, [cases]);

  if (isLoading) {
     return (
        <div className="flex h-[60vh] items-center justify-center">
           <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
     );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Station Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Live Database Key Performance Indicators.</p>
        </div>
        <Select defaultValue="7d">
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days (Demo)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={metrics.total.toString()} trend="+4 today" icon={<Activity />} positive={false} />
        <StatCard title="Cases Resolved" value={metrics.resolved.toString()} trend="Good velocity" icon={<Target />} positive={true} />
        <StatCard title="Funds Frozen" value={`₹${(metrics.frozen || 0).toLocaleString('en-IN')}`} trend="Up this week" icon={<IndianRupee />} positive={true} />
        <StatCard title="Avg Resolution Time" value="Data Logging" trend="Real-time ETA pending" icon={<Activity />} positive={true} subtitle="vs previous sprint" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Case Velocity (Last 7 Days)</CardTitle>
            <CardDescription>Inward vs Outward clearance</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.BAR_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="new" name="New Cases" stackId="a" fill="#94a3b8" radius={[0, 0, 4, 4]} barSize={24} />
                <Bar dataKey="pending" name="Open" stackId="a" fill="#cbd5e1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="solved" name="Resolved" stackId="a" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Breakdown by active cybercrime types</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col items-center justify-center">
            {metrics.PIE_DATA.length === 0 ? (
               <div className="text-slate-400 text-sm">No categorical data available</div>
            ) : (
               <>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={metrics.PIE_DATA} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                       {metrics.PIE_DATA.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full mt-4">
                   {metrics.PIE_DATA.map((entry, index) => (
                     <div key={index} className="flex items-center text-xs text-slate-600 truncate">
                       <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
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

function StatCard({ title, value, trend, icon, positive, subtitle }: any) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-500">{title}</h3>
          <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-bold text-slate-900">{value}</h2>
          <span className={`text-xs font-bold flex items-center ${positive ? 'text-emerald-600' : 'text-slate-500'}`}>
            {positive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {trend}
          </span>
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
