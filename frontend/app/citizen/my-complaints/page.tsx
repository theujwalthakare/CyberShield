"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, FileWarning } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";

type Complaint = {
  complaint_id: string;
  crime_category: string;
  status: string;
  submitted_at: string;
  financial_loss_amount?: number;
  raw_description?: string;
};

const STATUS_STYLE: Record<string, string> = {
  RECEIVED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  ASSIGNED: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  INVESTIGATION: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  CHARGESHEET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  VERDICT: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("citizen_id")
        .eq("auth_subject", user.id)
        .maybeSingle();
      if (!profile?.citizen_id) { setComplaints([]); return; }
      const { data, error } = await supabase
        .from("complaints")
        .select("complaint_id, crime_category, status, submitted_at, financial_loss_amount, raw_description")
        .eq("victim_id", profile.citizen_id)
        .eq("is_deleted", false)
        .order("submitted_at", { ascending: false });
      if (error) throw new Error(error.message);
      setComplaints(data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Complaints</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All complaints you have filed.</p>
        </div>
        <Link href="/citizen/file-complaint" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors">
          <FileWarning className="w-4 h-4" /> New Complaint
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-500" /></div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <FileWarning className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No complaints filed yet.</p>
            <Link href="/citizen/file-complaint" className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">File your first complaint</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {complaints.map(c => (
              <div key={c.complaint_id} className="flex items-start justify-between px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{c.complaint_id}</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{c.crime_category?.replace(/_/g, " ")}</p>
                  {c.raw_description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 max-w-sm">{c.raw_description}</p>
                  )}
                  <p className="text-[10px] text-slate-400">{new Date(c.submitted_at).toLocaleString("en-IN")}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[c.status] ?? "bg-slate-100 text-slate-500"}`}>
                    {c.status?.replace(/_/g, " ")}
                  </span>
                  {c.financial_loss_amount != null && (
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                      ₹{c.financial_loss_amount.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
