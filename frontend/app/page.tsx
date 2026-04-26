"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield, FileWarning, Activity, Map, BookOpen, ArrowRight,
  ShieldAlert, Database, LogIn, X, User, UserCheck, ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import NavHeader from "@/components/ui/nav-header";
import { Footer } from "@/components/footer";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { normalizeRole } from "@/lib/rbac";

const features = [
  { icon: FileWarning, title: "Report Cybercrime", description: "File structured incident reports with guided workflows and secure evidence lockers.", color: "from-rose-500 to-red-600", shadow: "shadow-rose-500/20" },
  { icon: Activity, title: "Case Tracking", description: "Real-time status updates from submission to resolution across all jurisdictions.", color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20" },
  { icon: Database, title: "Intelligence Dashboard", description: "Deep dive into 10-year macro trend velocities and regional impact hotspots.", color: "from-cyan-400 to-blue-500", shadow: "shadow-cyan-500/20" },
  { icon: Map, title: "Threat Map", description: "Geographic CartoDB visualization of crime districts and severity indexing.", color: "from-amber-400 to-orange-500", shadow: "shadow-amber-500/20" },
  { icon: ShieldAlert, title: "AI-Powered Guidance", description: "Personalized action plans and remediation steps powered by neural threat analysis.", color: "from-emerald-400 to-emerald-600", shadow: "shadow-emerald-500/20" },
  { icon: BookOpen, title: "Knowledge Center", description: "Enterprise-grade educational resources and zero-day prevention tactics.", color: "from-purple-500 to-violet-600", shadow: "shadow-purple-500/20" },
];

const ROLE_OPTIONS = [
  { role: "citizen", label: "Citizen", desc: "Report incidents & track cases", icon: User, color: "border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/10", badge: "text-cyan-300", href: "/sign-up/citizen" },
  { role: "officer", label: "Law Enforcement Officer", desc: "Investigate cases & access intelligence", icon: UserCheck, color: "border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/10", badge: "text-emerald-300", href: "/sign-up/officer" },
  { role: "admin", label: "System Administrator", desc: "Provisioned by system only", icon: ShieldCheck, color: "border-violet-500/40 hover:border-violet-400 hover:bg-violet-500/10", badge: "text-violet-300", href: "/sign-up/admin" },
];

// ─── Role Picker Modal ────────────────────────────────────────────────────────
function RolePickerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-100">Who are you registering as?</h2>
          <p className="mt-1 text-sm text-slate-400">Choose your role to go to the correct signup page.</p>
        </div>
        <div className="space-y-3">
          {ROLE_OPTIONS.map(({ role, label, desc, icon: Icon, color, badge, href }) => (
            <button
              key={role}
              onClick={() => { onClose(); router.push(href); }}
              className={`w-full flex items-center gap-4 rounded-xl border bg-slate-800/60 px-4 py-3.5 text-left transition-all ${color}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700/60">
                <Icon className={`h-5 w-5 ${badge}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${badge}`}>{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Smart Login Button ───────────────────────────────────────────────────────
function LoginButton() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function handleLogin() {
    setChecking(true);
    router.push("/sign-in/citizen");
    setChecking(false);
  }

  return (
    <Button
      onClick={handleLogin}
      disabled={checking}
      className="h-10 gap-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white px-5 text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
    >
      {checking ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      Login
    </Button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [showRolePicker, setShowRolePicker] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] relative overflow-hidden selection:bg-cyan-500/30">
      {/* Background glows */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 dark:opacity-20 animate-blob pointer-events-none" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 dark:opacity-20 animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 dark:opacity-20 animate-blob animation-delay-4000 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-500" />
                <Image src="/logo.png" alt="CyberShield Nexus" width={40} height={40} className="relative rounded-xl shadow-md border border-slate-200 dark:border-slate-800" />
              </div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                CyberShield <span className="text-cyan-600 dark:text-cyan-400">Nexus</span>
              </span>
            </div>
            <div className="hidden md:flex flex-1 items-center justify-center">
              <NavHeader />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Sign Up button */}
            <button
              onClick={() => setShowRolePicker(true)}
              className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Sign Up
            </button>
            {/* Login button — checks session first */}
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Role picker modal */}
      {showRolePicker && <RolePickerModal onClose={() => setShowRolePicker(false)} />}

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
          <div onClick={() => setShowRolePicker(true)} className="w-full sm:w-auto cursor-pointer">
            <Button size="lg" className="w-full sm:w-auto text-base font-bold h-14 px-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl shadow-slate-900/20 dark:shadow-white/10 transition-all hover:scale-105">
              Report an Incident
            </Button>
          </div>
          <Link href="#features" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base font-bold h-14 px-8 rounded-full border-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 text-slate-700 dark:text-slate-300">
              Explore Platform
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8 z-10">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Platform Capabilities</h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto rounded-full" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card key={f.title} className="group relative overflow-hidden border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-10 fill-mode-both" style={{ animationDelay: `${300 + i * 50}ms` }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-500`} />
              <CardContent className="flex flex-col items-start gap-4 p-8 relative z-10">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${f.color} shadow-lg ${f.shadow} text-white`}>
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">{f.title}</h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* News */}
      <section id="news" className="relative mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8 z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Latest Cyber News</h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto rounded-full" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl hover:-translate-y-1 transition duration-300">
            <CardContent className="p-8">
              <div className="text-xs text-cyan-600 dark:text-cyan-400 font-bold mb-3 uppercase tracking-wider">Security Alert</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">New Zero-Day Vulnerability Exploited in Popular Software</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">A critical vulnerability (CVSS 9.8) has been discovered, allowing unauthorized remote execution. Ensure your systems are patched immediately.</p>
              <Link href="#" className="inline-flex items-center text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors">
                Read Full Advisory <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl hover:-translate-y-1 transition duration-300">
            <CardContent className="p-8">
              <div className="text-xs text-cyan-600 dark:text-cyan-400 font-bold mb-3 uppercase tracking-wider">Industry Trend</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Ransomware Attacks Surge by 40% in Q3</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">Recent data indicates a massive spike in targeted ransomware campaigns against healthcare and educational institutions.</p>
              <Link href="#" className="inline-flex items-center text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors">
                Read Report <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative bg-slate-100 dark:bg-slate-900 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold uppercase tracking-wider">
              Our Mission
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Securing the Digital Frontier</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              CyberShield Nexus was built with a singular vision: to bridge the gap between complex enterprise security intelligence and everyday users. We aim to democratize cyber-threat reporting, making it accessible, actionable, and integrated with global authorities.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              By combining artificial intelligence with a crowdsourced threat reporting map, we empower both individuals and security teams to respond to incidents faster than ever before.
            </p>
          </div>
          <div className="flex-1 relative">
            <div className="aspect-video w-full rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center justify-center p-8 backdrop-blur-sm">
              <ShieldAlert className="w-32 h-32 text-cyan-600/50 dark:text-cyan-400/50" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
