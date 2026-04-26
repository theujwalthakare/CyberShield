"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search, Filter, ArrowUpDown, Eye, ShieldAlert, Loader2, RefreshCw,
} from "lucide-react";
import { fetchCases, type CaseItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const SCORE_STYLE = (score: number) => {
  if (score >= 80) return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
  if (score >= 60) return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
  if (score >= 40) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
};

const STATUS_STYLE: Record<string, string> = {
  received: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  assigned: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  investigation: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  classified: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  chargesheet: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  verdict: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function OfficerQueuePage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortDesc, setSortDesc] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCases({
        status: statusFilter === "all" ? undefined : statusFilter,
        sort_by: "severity",
        sort_order: sortDesc ? "desc" : "asc",
        limit: 100,
      });
      setCases(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortDesc]);

  useEffect(() => { load(); }, [load]);

  const filtered = cases.filter(c =>
    c.case_number.toLowerCase().includes(search.toLowerCase()) ||
    c.crime_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Case Routing Queue</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">AI-prioritized incoming cybercrime complaints.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by ID or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="w-40 bg-white dark:bg-slate-900">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="investigation">Investigation</SelectItem>
                <SelectItem value="classified">Classified</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDesc(p => !p)}
              className="gap-1.5"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortDesc ? "High → Low" : "Low → High"}
            </Button>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {filtered.length} of {cases.length} cases
            </span>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-950/50">
                  <TableHead className="w-20">Score</TableHead>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Financial Risk</TableHead>
                  <TableHead>Filed On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-500 dark:text-slate-400">
                      No cases found in the queue.
                    </TableCell>
                  </TableRow>
                ) : filtered.map(row => (
                  <TableRow key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 group">
                    <TableCell>
                      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm ${SCORE_STYLE(row.severity_score ?? 0)}`}>
                        {row.severity_score ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{row.case_number}</span>
                        {row.is_escalated && (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mt-0.5">
                            <ShieldAlert className="w-3 h-3" /> ORGANIZED CRIME
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                      {row.crime_type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {row.financial_loss > 0
                        ? `₹${row.financial_loss.toLocaleString("en-IN")}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(row.created_at).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] font-bold border-none ${STATUS_STYLE[row.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {row.status.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/officer/complaint/${row.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
