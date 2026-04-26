import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const settingsItems = [
  { title: "Retention Policy", description: "Keep audit trails for 365 days.", status: "Active" },
  { title: "Admin MFA", description: "Require MFA for all admin sessions.", status: "Enabled" },
  { title: "Emergency Access", description: "Break-glass controls for incident response.", status: "Configured" },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Administrative controls for retention, access, and governance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {settingsItems.map((item) => (
          <Card key={item.title} className="bg-white/70 backdrop-blur border-slate-200/70 dark:bg-slate-950/60 dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{item.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}