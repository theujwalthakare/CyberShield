"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
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
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

interface AlertItem {
  id: number;
  alert_type: string;
  area_code: string;
  severity: string;
  message: string;
  status: string;
  created_at: string | null;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

export default function AlertsPage() {
  const { getToken } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter]);

  async function loadAlerts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (severityFilter && severityFilter !== "all")
        params.set("severity", severityFilter);
      const res = await fetch(`${API_BASE}/alerts?${params}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function acknowledgeAlert(id: number) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/alerts/${id}/ack`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Alert acknowledged");
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: "acknowledged" } : a
          )
        );
      }
    } catch {
      toast.error("Failed to acknowledge alert");
    }
  }

  const activeCount = alerts.filter(
    (a) => a.status !== "acknowledged"
  ).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" /> Alerts
          </h1>
          <p className="text-muted-foreground">
            {activeCount} active alert{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Select value={severityFilter} onValueChange={(val) => setSeverityFilter(val ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert Feed</CardTitle>
          <CardDescription>
            Real-time threat alerts from the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No alerts found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.alert_type}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {a.area_code}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={severityColors[a.severity] ?? ""}
                      >
                        {a.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {a.message}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          a.status === "acknowledged"
                            ? "outline"
                            : "default"
                        }
                      >
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.status !== "acknowledged" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => acknowledgeAlert(a.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
