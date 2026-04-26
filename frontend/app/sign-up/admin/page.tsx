"use client";

import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminSignUpPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.2),transparent_50%)]" />

      <main className="relative mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <section className="mb-6 rounded-2xl border border-violet-500/20 bg-slate-900/75 p-6 backdrop-blur">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-violet-200 uppercase">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin Access
          </p>
          <h1 className="text-2xl font-black tracking-tight">System Administrator</h1>
          <p className="mt-1 text-sm text-slate-400">
            Admin accounts are provisioned directly by the system. Self-registration is not available.
          </p>
        </section>

        <Card className="border-slate-700 bg-slate-900/90 text-slate-100">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
                <Lock className="h-8 w-8 text-violet-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-violet-300">Restricted Registration</h2>
                <p className="max-w-sm text-sm text-slate-400 leading-relaxed">
                  Admin accounts are created and managed exclusively by system administrators.
                  If you require admin access, contact your system administrator with your
                  official credentials and department details.
                </p>
              </div>
              <div className="w-full rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-xs text-violet-300 text-left space-y-1">
                <p className="font-semibold">Admin privileges include:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  <li>Full user management &amp; role assignment</li>
                  <li>Audit log access &amp; system monitoring</li>
                  <li>All officer &amp; citizen permissions</li>
                  <li>Alert creation &amp; knowledge base management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/sign-in" className="font-semibold text-cyan-300 hover:text-cyan-200">Sign in</Link>
          <span className="mx-2 text-slate-600">·</span>
          <Link href="/sign-up/citizen" className="font-semibold text-cyan-400 hover:text-cyan-300">Citizen signup</Link>
          <span className="mx-2 text-slate-600">·</span>
          <Link href="/sign-up/officer" className="font-semibold text-emerald-400 hover:text-emerald-300">Officer signup</Link>
        </p>
      </main>
    </div>
  );
}
