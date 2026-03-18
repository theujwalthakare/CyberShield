"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, IndianRupee, TrendingUp, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

interface TrendsData {
  summary: {
    total_incidents: number;
    top_crime_type: string;
    loss_amount: number;
  };
  distribution: { crime_type: string; count: number }[];
}

interface LossSummary {
  total_loss: number;
  avg_loss: number;
  max_loss: number;
}

const COLORS = [
  "#6366f1",
  "#f43f5e",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#ef4444",
  "#84cc16",
];

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loss, setLoss] = useState<LossSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [tRes, lRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/trends`, { cache: "no-store" }),
          fetch(`${API_BASE}/analytics/loss-summary`, { cache: "no-store" }),
        ]);
        if (tRes.ok) setTrends(await tRes.json());
        if (lRes.ok) setLoss(await lRes.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" /> Analytics
        </h1>
        <p className="text-muted-foreground">
          Crime statistics and financial impact overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {trends?.summary.total_incidents ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top Crime Type</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold capitalize">
              {trends?.summary.top_crime_type ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3" /> Total Loss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{fmt(loss?.total_loss ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Avg Loss per Case
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{fmt(loss?.avg_loss ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart - Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Incidents by Crime Type</CardTitle>
          </CardHeader>
          <CardContent>
            {!trends?.distribution?.length ? (
              <p className="py-8 text-center text-muted-foreground">
                No data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trends.distribution}>
                  <XAxis
                    dataKey="crime_type"
                    fontSize={12}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    fontSize={12}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {trends.distribution.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Crime Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {!trends?.distribution?.length ? (
              <p className="py-8 text-center text-muted-foreground">
                No data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trends.distribution}
                    dataKey="count"
                    nameKey="crime_type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ crime_type }) => crime_type}
                  >
                    {trends.distribution.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Max Loss */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Loss</p>
              <p className="text-2xl font-bold">₹{fmt(loss?.total_loss ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Loss</p>
              <p className="text-2xl font-bold">₹{fmt(loss?.avg_loss ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Highest Single Loss</p>
              <p className="text-2xl font-bold">₹{fmt(loss?.max_loss ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
