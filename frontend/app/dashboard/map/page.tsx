"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
import { Loader2, Map as MapIcon } from "lucide-react";
import { fetchRiskAreas } from "@/lib/api";

// Lazy-load the map component to avoid SSR issues with Leaflet
const ThreatMapView = dynamic(() => import("@/components/threat-map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center bg-muted rounded-lg">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  ),
});

interface RiskArea {
  area_code: string;
  score: number;
  risk_level: string;
}

const riskColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

export default function ThreatMapPage() {
  const [areas, setAreas] = useState<RiskArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchRiskAreas();
        setAreas(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapIcon className="h-6 w-6" /> Threat Map
        </h1>
        <p className="text-muted-foreground">
          Geographic risk visualization across monitored areas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Heatmap</CardTitle>
          <CardDescription>
            Areas colored by risk score. Click a marker for details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden rounded-b-lg">
          <ThreatMapView areas={areas} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Areas ({areas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : areas.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No risk data available yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area Code</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((a) => (
                  <TableRow key={a.area_code}>
                    <TableCell className="font-mono">
                      {a.area_code}
                    </TableCell>
                    <TableCell className="font-bold">{a.score}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={riskColors[a.risk_level] ?? ""}
                      >
                        {a.risk_level}
                      </Badge>
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
