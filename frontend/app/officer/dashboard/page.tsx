"use client";

import {
  FileText, AlertTriangle, Clock, Shield, TrendingUp,
  ChevronRight, Flame, IndianRupee, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";

type Case = {
  complaint_id: string;
  crime_category: string;
  status: string;
  priority_score?: number;
  financial_loss_amount?: number;
  submitted_at: string;
  organized_crime_flag?: boolean;
};

export default function OfficerDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("complaints")
        .select("complaint_id, crime_category, status, priority_score, financial_loss_amount, submitted_at, organized_crime_flag")
        .eq("is_deleted", false)
        .order("submitted_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      setCases(data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCases(); }, [loadCases]);

  const topPriorityCases = [...cases]
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, 5);

  const pendingFIRs = cases.filter(c => c.status === "INVESTIGATION" || c.status === "ASSIGNED").length;
  const criticalCount = cases.filter(c => (c.priority_score || 0) >= 80).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Officer Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time overview of your assigned cases.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<FileText className="w-5 h-5 text-blue-500" />} label="Total Assigned" value={cases.length.toString()} trend="+3 today" bg="bg-blue-50 dark:bg-blue-950" />
        <KPICard icon={<AlertTriangle className="w-5 h-5 text-red-500" />} label="Critical (80+)" value={criticalCount.toString()} trend={criticalCount > 0 ? "Needs attention" : "All good"} bg="bg-red-50 dark:bg-red-950" highlight={criticalCount > 0} />
        <KPICard icon={<Shield className="w-5 h-5 text-teal-500" />} label="Pending Action" value={pendingFIRs.toString()} trend="In queue" bg="bg-teal-50 dark:bg-teal-950" />
        <KPICard icon={<Clock className="w-5 h-5 text-amber-500" />} label="Total Cases" value={cases.length.toString()} trend="Last 20 loaded" bg="bg-amber-50 dark:bg-amber-950" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-900 dark:text-white">Priority Queue</h2>
            <span className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 font-semibold px-2 py-0.5 rounded-full">AI-Ranked</span>
          </div>
          <Link href="/officer/queue" className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 font-medium flex items-center gap-1">
            Full Queue <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            </div>
          ) : topPriorityCases.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">No cases currently assigned.</div>
          ) : topPriorityCases.map(item => (
            <Link
              key={item.complaint_id}
              href={`/officer/complaint/${item.complaint_id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold shrink-0 ${
                (item.priority_score || 0) >= 80 ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" :
                (item.priority_score || 0) >= 60 ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300" :
                (item.priority_score || 0) >= 40 ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300" :
                "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}>
                <span className="text-base leading-none">{item.priority_score || 0}</span>
                <span className="text-[8px] uppercase mt-0.5">Score</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{item.complaint_id}</p>
                  {item.organized_crime_flag && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 px-1.5 py-0.5 rounded-full">
                      <Flame className="w-3 h-3" /> ORGANIZED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.crime_category?.replace(/_/g, " ")} · {new Date(item.submitted_at).toLocaleDateString("en-IN")}
                </p>
              </div>

              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {(item.financial_loss_amount || 0).toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {item.status?.replace(/_/g, " ")}
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction href="/officer/queue" icon={<TrendingUp className="w-5 h-5" />} title="Full Queue" desc="View all ranked complaints" />
        <QuickAction href="/officer/suspect-lookup" icon={<Shield className="w-5 h-5" />} title="Suspect Lookup" desc="Search by phone, UPI, email" />
        <QuickAction href="/officer/analytics" icon={<FileText className="w-5 h-5" />} title="Analytics" desc="Station crime data" />
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, trend, bg, highlight }: {
  icon: React.ReactNode; label: string; value: string; trend: string; bg: string; highlight?: boolean;
}) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${highlight ? "border-red-200 dark:border-red-800" : "border-slate-200 dark:border-slate-800"} shadow-sm p-5 hover:shadow-md transition-shadow ${highlight ? "ring-1 ring-red-100 dark:ring-red-900" : ""}`}>
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bg} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{label}</p>
      <p className={`text-[10px] mt-1 ${highlight ? "text-red-600 dark:text-red-400 font-semibold" : "text-slate-400 dark:text-slate-500"}`}>{trend}</p>
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: {
  href: string; icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-900 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}
