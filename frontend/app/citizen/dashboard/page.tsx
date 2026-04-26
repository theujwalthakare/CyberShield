"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileWarning, ListChecks, ShieldCheck, Clock, ChevronRight, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";

type Complaint = {
  complaint_id: string;
  crime_category: string;
  status: string;
  submitted_at: string;
  financial_loss_amount?: number;
};

const STATUS_STYLE: Record<string, string> = {
  RECEIVED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  ASSIGNED: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  INVESTIGATION: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  CHARGESHEET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  VERDICT: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

async function getCitizenComplaints(limit = 10) {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // Resolve citizen_id from user_profiles
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("citizen_id")
    .eq("auth_subject", user.id)
    .maybeSingle();
  if (!profile?.citizen_id) return [];
  const { data, error } = await supabase
    .from("complaints")
    .select("complaint_id, crime_category, status, submitted_at, financial_loss_amount")
    .eq("victim_id", profile.citizen_id)
    .eq("is_deleted", false)
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default function CitizenDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCitizenComplaints(10);
      setComplaints(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === "VERDICT" || c.status === "CHARGESHEET").length;
  const pending = complaints.filter(c => c.status === "RECEIVED" || c.status === "ASSIGNED").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your complaints and stay informed.</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Filed", value: total, icon: ListChecks, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950" },
          { label: "Pending", value: pending, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" },
          { label: "Resolved", value: resolved, icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bg} mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "—" : value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/citizen/file-complaint" className="group flex items-center gap-4 p-5 bg-cyan-600 hover:bg-cyan-500 rounded-2xl shadow-sm transition-all">
          <FileWarning className="w-6 h-6 text-white shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">File a New Complaint</p>
            <p className="text-xs text-cyan-100">Report a cybercrime incident</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white ml-auto" />
        </Link>
        <Link href="/citizen/my-complaints" className="group flex items-center gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <ListChecks className="w-6 h-6 text-slate-500 dark:text-slate-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">View My Complaints</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track status and updates</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
        </Link>
      </div>

      {/* Recent complaints */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">Recent Complaints</h2>
          <Link href="/citizen/my-complaints" className="text-sm text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-500" /></div>
        ) : complaints.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No complaints filed yet.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {complaints.slice(0, 5).map(c => (
              <div key={c.complaint_id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.complaint_id}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {c.crime_category?.replace(/_/g, " ")} · {new Date(c.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[c.status] ?? "bg-slate-100 text-slate-500"}`}>
                  {c.status?.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
