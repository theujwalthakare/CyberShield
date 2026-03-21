import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  FileWarning,
  Activity,
  Map,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Database
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: FileWarning,
    title: "Report Cybercrime",
    description: "File structured incident reports with guided workflows and secure evidence lockers.",
    color: "from-rose-500 to-red-600",
    shadow: "shadow-rose-500/20"
  },
  {
    icon: Activity,
    title: "Case Tracking",
    description: "Real-time status updates from submission to resolution across all jurisdictions.",
    color: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/20"
  },
  {
    icon: Database,
    title: "Intelligence Dashboard",
    description: "Deep dive into 10-year macro trend velocities and regional impact hotspots.",
    color: "from-cyan-400 to-blue-500",
    shadow: "shadow-cyan-500/20"
  },
  {
    icon: Map,
    title: "Threat Map",
    description: "Geographic CartoDB visualization of crime districts and severity indexing.",
    color: "from-amber-400 to-orange-500",
    shadow: "shadow-amber-500/20"
  },
  {
    icon: ShieldAlert,
    title: "AI-Powered Guidance",
    description: "Personalized action plans and remediation steps powered by neural threat analysis.",
    color: "from-emerald-400 to-emerald-600",
    shadow: "shadow-emerald-500/20"
  },
  {
    icon: BookOpen,
    title: "Knowledge Center",
    description: "Enterprise-grade educational resources and zero-day prevention tactics.",
    color: "from-purple-500 to-violet-600",
    shadow: "shadow-purple-500/20"
  }
];

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] relative overflow-hidden selection:bg-cyan-500/30">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 dark:opacity-20 animate-blob pointer-events-none" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 dark:opacity-20 animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 dark:opacity-20 animate-blob animation-delay-4000 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <Image src="/logo.png" alt="CyberShield Nexus" width={40} height={40} className="relative rounded-xl shadow-md border border-slate-200 dark:border-slate-800" />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              CyberShield <span className="text-cyan-600 dark:text-cyan-400">Nexus</span>
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <ThemeToggle />
            <Link href="/sign-in" className="hidden sm:block">
              <Button variant="ghost" className="font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-full">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 border-0 rounded-full px-6 sm:px-8 h-10 sm:h-12 w-full transition-all hover:scale-105">
                Get Started <ArrowRight className="ml-2 w-4 h-4 hidden sm:block"/>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pt-24 pb-32 text-center sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs sm:text-sm font-bold mb-8 overflow-hidden relative group tracking-wider uppercase">
           <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_2s_infinite]" />
           <Shield className="w-4 h-4" /> Next-Generation Threat Intelligence
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl mb-8 leading-tight">
          Cybercrime Assistance &<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 filter drop-shadow-sm pb-2 inline-block">Intelligence Platform</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium">
          Report incidents, receive AI-powered guidance, and empower authorities
          to detect emerging cyber threats with enterprise-grade analytics.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base font-bold h-14 px-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl shadow-slate-900/20 dark:shadow-white/10 transition-all hover:scale-105">
              Report an Incident
            </Button>
          </Link>
          <Link href="#features" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base font-bold h-14 px-8 rounded-full border-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 text-slate-700 dark:text-slate-300">
              Explore Platform
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8 z-10"
      >
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
            Platform Capabilities
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto rounded-full" />
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card key={f.title} className="group relative overflow-hidden border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-10 fill-mode-both" style={{ animationDelay: `${300 + (i * 50)}ms` }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-500`} />
              <CardContent className="flex flex-col items-start gap-4 p-8 relative z-10">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${f.color} shadow-lg ${f.shadow} text-white`}>
                    <f.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">{f.title}</h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  {f.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl py-12 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-80">
            <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200 tracking-wide">CyberShield Nexus</span>
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} University Project. Secure Architecture.
        </p>
      </footer>
    </div>
  );
}
