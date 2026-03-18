import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  FileWarning,
  Activity,
  BarChart3,
  Map,
  BookOpen,
} from "lucide-react";

const features = [
  {
    icon: FileWarning,
    title: "Report Cybercrime",
    description: "File structured incident reports with guided workflows.",
  },
  {
    icon: Activity,
    title: "Case Tracking",
    description: "Real-time status updates from submission to resolution.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Crime trends, risk scoring, and intelligence insights.",
  },
  {
    icon: Map,
    title: "Threat Map",
    description: "Geographic visualization of cybercrime hotspots.",
  },
  {
    icon: Shield,
    title: "AI-Powered Guidance",
    description: "Personalized action plans based on incident analysis.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Center",
    description: "Educational resources on cybercrime prevention.",
  },
];

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">
              CyberShield Nexus
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Cybercrime Assistance &{" "}
          <span className="text-blue-600">Intelligence Platform</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Report incidents, receive AI-powered guidance, and help authorities
          detect emerging cyber threats — all in one secure platform.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="text-base">
              Report a Cybercrime
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="text-base">
              Explore Features
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8"
      >
        <h2 className="mb-10 text-center text-2xl font-bold text-slate-900">
          Platform Capabilities
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <f.icon className="h-8 w-8 text-blue-600" />
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {f.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} CyberShield Nexus. University
        Project.
      </footer>
    </div>
  );
}
