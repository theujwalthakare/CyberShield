import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileWarning,
  Shield,
  AlertTriangle,
  BarChart3,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchIncidents, fetchAlerts, fetchRiskAreas } from "@/lib/api";

async function fetchDashboardData() {
  try {
    const [incidents, alerts, riskAreas] = await Promise.all([
      fetchIncidents(),
      fetchAlerts(),
      fetchRiskAreas(),
    ]);

    return {
      incidents: Array.isArray(incidents) ? incidents : [],
      alerts: Array.isArray(alerts) ? alerts : [],
      riskAreas: Array.isArray(riskAreas) ? riskAreas : [],
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { incidents: [], alerts: [], riskAreas: [] };
  }
}

export default async function DashboardPage() {
  const { userId } = await auth();
  const { incidents, alerts, riskAreas } = await fetchDashboardData();

  const highRiskCount = riskAreas.filter(
    (a: { risk_level: string }) =>
      a.risk_level === "high" || a.risk_level === "critical"
  ).length;

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back. Here&apos;s your security overview.
          </p>
        </div>
        <Link href="/dashboard/report">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Report Incident
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Incidents
            </CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
            <p className="text-xs text-muted-foreground">All time reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              High Risk Areas
            </CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRiskCount}</div>
            <p className="text-xs text-muted-foreground">
              High + Critical zones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Tracked Regions
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskAreas.length}</div>
            <p className="text-xs text-muted-foreground">Monitored zones</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No incidents reported yet.
              </p>
            ) : (
              <div className="space-y-3">
                {incidents.slice(0, 5).map(
                  (inc: {
                    id: number;
                    crime_type: string;
                    victim_area: string;
                    severity_level: string;
                  }) => (
                    <div
                      key={inc.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{inc.crime_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {inc.victim_area}
                        </p>
                      </div>
                      <Badge
                        variant={
                          inc.severity_level === "high"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {inc.severity_level}
                      </Badge>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active alerts.
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map(
                  (
                    alert: {
                      alert_type: string;
                      severity: string;
                      message: string;
                      area_code: string;
                    },
                    i: number
                  ) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {alert.alert_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {alert.message}
                        </p>
                      </div>
                      <Badge
                        variant={
                          alert.severity === "high"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {alert.area_code}
                      </Badge>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
