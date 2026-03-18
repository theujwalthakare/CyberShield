"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, Users } from "lucide-react";
import { toast } from "sonner";

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
  is_escalated: boolean;
  assigned_officer_id: number | null;
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

export default function AdminPage() {
  const { getToken } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadCases() {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "100");

      const res = await fetch(`${API_BASE}/cases?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCases(data.items ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(caseId: number, newStatus: string) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/cases/${caseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Status updated to ${newStatus}`);
        setCases((prev) =>
          prev.map((c) =>
            c.id === caseId ? { ...c, status: newStatus } : c
          )
        );
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.detail ?? "Update failed");
      }
    } catch {
      toast.error("Failed to update status");
    }
  }

  const totalCases = cases.length;
  const pendingCases = cases.filter((c) => c.status === "submitted").length;
  const escalatedCases = cases.filter((c) => c.is_escalated).length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" /> Admin Panel
        </h1>
        <p className="text-muted-foreground">
          Manage cases, update statuses, and monitor platform activity
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cases</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalCases}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {pendingCases}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Escalated</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {escalatedCases}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
        <Button variant="outline" onClick={loadCases}>
          Refresh
        </Button>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> All Cases
          </CardTitle>
          <CardDescription>
            Click a status dropdown to update case status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : cases.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No cases found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Loss</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">
                        {c.case_number}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate font-medium">
                        {c.title}
                        {c.is_escalated && (
                          <Badge
                            variant="destructive"
                            className="ml-2 text-xs"
                          >
                            ESC
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{c.crime_type}</TableCell>
                      <TableCell>
                        {c.severity_score ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={c.status}
                          onValueChange={(val) => val && updateStatus(c.id, val)}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <Badge
                              variant="secondary"
                              className={statusColors[c.status] ?? ""}
                            >
                              {c.status.replace(/_/g, " ")}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">
                              Submitted
                            </SelectItem>
                            <SelectItem value="reviewing">
                              Reviewing
                            </SelectItem>
                            <SelectItem value="assigned">
                              Assigned
                            </SelectItem>
                            <SelectItem value="investigating">
                              Investigating
                            </SelectItem>
                            <SelectItem value="resolved">
                              Resolved
                            </SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
