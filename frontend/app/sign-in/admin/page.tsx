"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getRoleHomePath } from "@/lib/legacy-dashboard";
import { normalizeRole } from "@/lib/rbac";

export default function AdminSignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || getRoleHomePath("admin"), [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.user) { setError(signInError?.message || "Sign-in failed."); return; }

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("auth_subject", data.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        setError(`Profile lookup failed: ${profileError.message}`);
        return;
      }

      if (!profile) {
        await supabase.auth.signOut();
        setError(`No user_profiles row found for this account. Run: INSERT INTO public.user_profiles (auth_subject, role, email, full_name) VALUES ('${data.user.id}', 'admin', '${data.user.email}', 'Admin');`);
        return;
      }

      const effectiveRole = normalizeRole(profile.role);

      if (effectiveRole !== "admin") {
        await supabase.auth.signOut();
        setError(`Access denied. This account has role "${profile.role}", not "admin".`);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.2),transparent_50%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-violet-200 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin Portal
            </p>
            <h1 className="text-2xl font-black tracking-tight">Administrator Sign In</h1>
            <p className="text-sm text-slate-400">Restricted access — system administrators only.</p>
          </div>

          <Card className="border-slate-700 bg-slate-900/90 text-slate-100">
            <CardContent className="pt-6">
              {/* Security notice */}
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
                <Lock className="h-4 w-4 shrink-0 text-violet-400 mt-0.5" />
                <p className="text-xs text-violet-300 leading-relaxed">
                  This portal is monitored. Unauthorized access attempts are logged and reported.
                  Admin credentials are provisioned by the system administrator only.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@cybershield.gov.in" required suppressHydrationWarning />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required suppressHydrationWarning />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

                <Button className="w-full bg-violet-700 hover:bg-violet-600" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Authenticating..." : "Sign In as Administrator"}
                </Button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-400">
                <Link href="/sign-in/citizen" className="font-semibold text-cyan-400 hover:text-cyan-300">Citizen login</Link>
                <span className="mx-2 text-slate-600">·</span>
                <Link href="/sign-in/officer" className="font-semibold text-emerald-400 hover:text-emerald-300">Officer login</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
