import AlertsList from "@/components/alerts-list";
import RiskTable from "@/components/risk-table";
import SummaryCard from "@/components/summary-card";
import { fetchAlerts, fetchRiskAreas } from "@/lib/api";

export default async function HomePage() {
  const [riskAreas, alerts] = await Promise.all([fetchRiskAreas(), fetchAlerts()]);

  const highRiskCount = riskAreas.filter((item) =>
    ["high", "critical"].includes(item.risk_level.toLowerCase())
  ).length;

  const avgRisk =
    riskAreas.length > 0
      ? Math.round(riskAreas.reduce((sum, item) => sum + item.score, 0) / riskAreas.length)
      : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">CyberShield Nexus</h1>
        <p className="mt-2 text-slate-600">
          Cyber crime intelligence and predictive risk monitoring dashboard
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Tracked Areas" value={riskAreas.length} subtitle="Active map zones" />
        <SummaryCard title="High Risk Areas" value={highRiskCount} subtitle="High + Critical" />
        <SummaryCard title="Average Risk Score" value={avgRisk} subtitle="0 to 100 scale" />
        <SummaryCard title="Open Alerts" value={alerts.length} subtitle="Latest notifications" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <RiskTable items={riskAreas} />
        <AlertsList items={alerts} />
      </section>
    </main>
  );
}
