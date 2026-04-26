"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getRoleHomePath } from "@/lib/legacy-dashboard";
import { normalizeRole } from "@/lib/rbac";

export default function AnalystSignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || getRoleHomePath("analyst"), [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.user) { setError(signInError?.message || "Sign-in failed."); return; }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("auth_subject", data.user.id)
        .maybeSingle();

      const effectiveRole = normalizeRole(profile?.role);

      // Pending analyst — not yet approved
      if (effectiveRole === "pending_analyst" as any) {
        router.replace("/pending-approval");
        return;
      }

      if (effectiveRole !== "analyst") {
        await supabase.auth.signOut();
        setError(`This account is registered as "${effectiveRole ?? "unknown"}". Use the correct sign-in page.`);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.2),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(109,40,217,0.15),transparent_40%)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full space-y-6">
          <div className="text-center space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-violet-200 uppercase">
              <Activity className="h-3.5 w-3.5" /> Analyst Portal
            </p>
            <h1 className="text-2xl font-black tracking-tight">Analyst Sign In</h1>
            <p className="text-sm text-slate-400">Access intelligence reports, analytics, and threat data.</p>
          </div>

          <Card className="border-slate-700 bg-slate-900/90 text-slate-100">
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="analyst@agency.gov.in" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-violet-300">
                  Analyst accounts require admin activation before first login.
                </div>
                {error && <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                <Button className="w-full bg-violet-700 hover:bg-violet-600" type="submit" disabled={submitting}>
                  {submitting ? "Signing in..." : "Sign In as Analyst"}
                </Button>
              </form>
              <p className="mt-4 text-center text-xs text-slate-400">
                No account?{" "}
                <Link href="/sign-up/analyst" className="font-semibold text-violet-300 hover:text-violet-200">Register</Link>
                <span className="mx-2 text-slate-600">·</span>
                <Link href="/sign-in/officer" className="font-semibold text-emerald-400 hover:text-emerald-300">Officer login</Link>
                <span className="mx-2 text-slate-600">·</span>
                <Link href="/sign-in/admin" className="font-semibold text-cyan-400 hover:text-cyan-300">Admin login</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
