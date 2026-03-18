"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FileWarning, Loader2 } from "lucide-react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

interface CaseItem {
  id: number;
  case_number: string;
  title: string;
  crime_type: string;
  status: string;
  severity_score: number | null;
  financial_loss: number;
  currency: string;
  created_at: string;
  description: string;
  affected_platform: string | null;
  victim_area: string | null;
  district: string | null;
  state: string | null;
  is_escalated: boolean;
  assigned_officer_id: number | null;
}

interface OfficerItem {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

const statusColors: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  analysis_complete: "bg-purple-100 text-purple-800",
  assigned: "bg-cyan-100 text-cyan-800",
  investigating: "bg-orange-100 text-orange-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function CasesPage() {
  const { getToken } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [guidance, setGuidance] = useState<string>("");
  const [officers, setOfficers] = useState<OfficerItem[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [canManageCases, setCanManageCases] = useState(false);

  useEffect(() => {
    loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadOfficers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCase) {
      setGuidance("");
      setSelectedOfficerId("");
      return;
    }

    setSelectedOfficerId(
      selectedCase.assigned_officer_id ? String(selectedCase.assigned_officer_id) : ""
    );
    loadGuidance(selectedCase.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCase?.id]);

  async function loadCases() {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      params.set("sort_by", sortBy);
      params.set("sort_order", sortOrder);

      const res = await fetch(`${API_BASE}/cases?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCases(Array.isArray(data) ? data : data.items ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function loadOfficers() {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/cases/officers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        setCanManageCases(false);
        return;
      }

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setOfficers(data.items ?? []);
      setCanManageCases(true);
    } catch {
      // silent
    }
  }

  async function loadGuidance(caseId: number) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/threats/case/${caseId}/guidance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setGuidance("");
        return;
      }

      const data = await res.json();
      setGuidance(data.guidance_text ?? "");
    } catch {
      setGuidance("");
    }
  }

  async function updateCaseStatus(newStatus: string) {
    if (!selectedCase) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/cases/${selectedCase.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? "Failed to update case status");
      }

      const updated = (await res.json()) as CaseItem;
      setSelectedCase(updated);
      setCases((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success("Case status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  }

  async function assignCase() {
    if (!selectedCase || !selectedOfficerId) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/cases/${selectedCase.id}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assigned_officer_id: Number(selectedOfficerId) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? "Failed to assign case");
      }

      const updated = (await res.json()) as CaseItem;
      setSelectedCase(updated);
      setCases((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success("Case assigned successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Cases</h1>
          <p className="text-muted-foreground">
            Track status of your submitted cybercrime reports
          </p>
        </div>
        <Button>
          <Link href="/dashboard/report">
            <FileWarning className="mr-2 h-4 w-4" />
            New Report
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(val) => setSortBy(val ?? "created_at")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Sort: Newest</SelectItem>
            <SelectItem value="severity">Sort: Severity</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={(val) => setSortOrder(val ?? "desc")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Desc</SelectItem>
            <SelectItem value="asc">Asc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cases ({cases.length})</CardTitle>
          <CardDescription>
            Click a case to view full details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cases.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No cases found.{" "}
              <Link
                href="/dashboard/report"
                className="text-primary underline"
              >
                Report an incident
              </Link>{" "}
              to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Loss</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedCase(c)}
                  >
                    <TableCell className="font-mono text-sm">
                      {c.case_number}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {c.title}
                    </TableCell>
                    <TableCell>{c.crime_type}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[c.status] ?? ""}
                      >
                        {c.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.financial_loss > 0
                        ? `${c.currency} ${c.financial_loss.toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Case Detail Dialog */}
      <Dialog
        open={!!selectedCase}
        onOpenChange={(open: boolean) => !open && setSelectedCase(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedCase && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono text-base">
                    {selectedCase.case_number}
                  </span>
                  <Badge
                    variant="secondary"
                    className={statusColors[selectedCase.status] ?? ""}
                  >
                    {selectedCase.status.replace(/_/g, " ")}
                  </Badge>
                  {selectedCase.is_escalated && (
                    <Badge variant="destructive">Escalated</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <Separator />
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{selectedCase.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedCase.description}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Crime Type:</span>{" "}
                    {selectedCase.crime_type}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Platform:</span>{" "}
                    {selectedCase.affected_platform ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Financial Loss:
                    </span>{" "}
                    {selectedCase.financial_loss > 0
                      ? `${selectedCase.currency} ${selectedCase.financial_loss.toLocaleString()}`
                      : "None reported"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Severity:</span>{" "}
                    {selectedCase.severity_score ?? "Pending"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Assigned Officer:</span>{" "}
                    {selectedCase.assigned_officer_id ?? "Unassigned"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    {[
                      selectedCase.victim_area,
                      selectedCase.district,
                      selectedCase.state,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Filed on:</span>{" "}
                    {new Date(selectedCase.created_at).toLocaleString()}
                  </div>
                </div>

                {guidance && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Generated Guidance</h4>
                    <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                      {guidance}
                    </div>
                  </div>
                )}

                {canManageCases && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Officer Actions</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Select
                          value={selectedOfficerId}
                          onValueChange={(val) => setSelectedOfficerId(val ?? "")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Assign officer" />
                          </SelectTrigger>
                          <SelectContent>
                            {officers.map((officer) => (
                              <SelectItem key={officer.id} value={String(officer.id)}>
                                {officer.full_name || officer.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={actionLoading || !selectedOfficerId}
                          onClick={assignCase}
                        >
                          {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Assign Case
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={actionLoading}
                          onClick={() => updateCaseStatus("reviewing")}
                        >
                          Mark Reviewing
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={actionLoading}
                          onClick={() => updateCaseStatus("investigating")}
                        >
                          Start Investigation
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={actionLoading}
                          onClick={() => updateCaseStatus("resolved")}
                        >
                          Mark Resolved
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          onClick={() => updateCaseStatus("closed")}
                        >
                          Close Case
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
