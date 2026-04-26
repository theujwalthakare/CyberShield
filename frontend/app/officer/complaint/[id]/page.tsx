"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, ShieldAlert, IndianRupee, Clock,
  FileText, Activity, CheckCircle2, Scale, Network, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchCases, fetchCaseGuidance, updateCaseStatusInDb, type CaseItem } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";

const STATUS_STYLE: Record<string, string> = {
  received: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  assigned: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  investigation: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  classified: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  chargesheet: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  verdict: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function OfficerComplaintDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [guidance, setGuidance] = useState<string>("");
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const [cases, guidanceText, evidenceRes] = await Promise.all([
        fetchCases({ limit: 250 }),
        fetchCaseGuidance(id),
        supabase
          .from("evidence_files")
          .select("file_id", { count: "exact", head: true })
          .eq("complaint_id", id),
      ]);
      setCaseItem(cases.find(c => c.id === id) ?? null);
      setGuidance(guidanceText);
      setEvidenceCount(evidenceRes.count ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleMarkInvestigating() {
    if (!caseItem || caseItem.status === "investigation") return;
    setUpdating(true);
    try {
      const updated = await updateCaseStatusInDb(id, "INVESTIGATION");
      setCaseItem(updated);
      toast.success("Case marked as under investigation");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="space-y-4 py-8 max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="py-16 text-center text-slate-500 dark:text-slate-400">
            Complaint not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              Case {caseItem.case_number}
              <Badge className={`font-bold uppercase border-none ${STATUS_STYLE[caseItem.status] ?? "bg-slate-100 text-slate-500"}`}>
                {caseItem.status.replace(/_/g, " ")}
              </Badge>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Received {new Date(caseItem.created_at).toLocaleString("en-IN")} · {caseItem.crime_type.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="text-teal-700 border-teal-200 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-300"
            disabled={caseItem.status === "investigation" || updating}
            onClick={handleMarkInvestigating}
          >
            {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            {caseItem.status === "investigation" ? "Investigating" : "Mark Investigating"}
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
            <Scale className="w-4 h-4 mr-2" /> Generate FIR Draft
          </Button>
          <Button variant="outline" size="icon" onClick={load}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left — 2/3 */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full bg-slate-100 dark:bg-slate-800 border p-1 rounded-xl grid grid-cols-3 h-auto">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 text-sm font-medium">Overview</TabsTrigger>
              <TabsTrigger value="evidence" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 text-sm font-medium">Evidence ({evidenceCount})</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 text-sm font-medium">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* AI Guidance */}
              <Card className="border-teal-200 dark:border-teal-900 shadow-sm overflow-hidden">
                <div className="bg-teal-50 dark:bg-teal-950 border-b border-teal-100 dark:border-teal-900 px-6 py-3 flex items-center justify-between">
                  <h3 className="text-teal-900 dark:text-teal-200 font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4" /> AI Case Guidance
                  </h3>
                  <Badge className="bg-teal-600 text-white border-0">
                    {Math.round(caseItem.ai_confidence * 100)}% Confidence
                  </Badge>
                </div>
                <CardContent className="pt-6">
                  {guidance ? (
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {guidance}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No guidance steps recorded for this case yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-slate-900 dark:text-white">Victim Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif whitespace-pre-wrap">
                    "{caseItem.description || "No description provided."}"
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evidence">
              <Card className="border-slate-200 dark:border-slate-800 mt-6">
                <CardContent className="pt-6 flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400 text-sm">
                  {evidenceCount === 0
                    ? "No evidence files attached to this case."
                    : `${evidenceCount} evidence file(s) attached. Evidence viewer coming soon.`}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card className="border-slate-200 dark:border-slate-800 mt-6">
                <CardContent className="pt-6 space-y-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">RECEIVED</p>
                      <p className="text-xs">Case submitted to system</p>
                    </div>
                    <p className="text-xs font-mono">{new Date(caseItem.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  {caseItem.status !== "received" && (
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{caseItem.status.toUpperCase()}</p>
                        <p className="text-xs">Current status</p>
                      </div>
                      <p className="text-xs font-mono">{new Date(caseItem.updated_at).toLocaleDateString("en-IN")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right — side panel */}
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-slate-900 dark:text-white">Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Disputed Amount</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" />
                  {(caseItem.financial_loss || 0).toLocaleString("en-IN")}
                </h3>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Escalation Status</p>
                <Badge variant="outline" className={`font-semibold flex items-center gap-1 w-fit ${caseItem.is_escalated ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>
                  {caseItem.is_escalated ? <><ShieldAlert className="w-3 h-3" /> Organized Crime</> : <><Clock className="w-3 h-3" /> Normal</>}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-slate-900 dark:text-white">Case Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: "Case ID", value: caseItem.id },
                { label: "Crime Type", value: caseItem.crime_type.replace(/_/g, " ") },
                { label: "District", value: caseItem.district ?? "—" },
                { label: "State", value: caseItem.state ?? "—" },
                { label: "Severity Score", value: caseItem.severity_score?.toString() ?? "—" },
                { label: "Assigned Officer", value: caseItem.assigned_officer_id?.toString() ?? "Unassigned" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center gap-3">
                  <span className="text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="font-medium text-slate-900 dark:text-white text-right truncate max-w-[140px]">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Link
            href="/officer/queue"
            className="inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
          >
            <Network className="w-4 h-4 mr-2" /> Back to Queue
          </Link>
        </div>
      </div>
    </div>
  );
}
