"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getRoleHomePath } from "@/lib/legacy-dashboard";
import { normalizeRole } from "@/lib/rbac";

export default function CitizenSignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || getRoleHomePath("citizen"), [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=citizen`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) { setError(error.message); setIsGoogleLoading(false); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setIsGoogleLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.user) { setError(signInError?.message || "Sign-in failed."); return; }

      const metaRole = normalizeRole(data.user.app_metadata?.role ?? data.user.user_metadata?.role);
      const { data: profile } = await supabase.from("user_profiles").select("role").eq("auth_subject", data.user.id).maybeSingle();
      const effectiveRole = normalizeRole(profile?.role) ?? metaRole;

      if (effectiveRole !== "citizen") {
        await supabase.auth.signOut();
        setError(`This account is registered as "${effectiveRole ?? "unknown"}". Use the correct sign-in page.`);
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(8,145,178,0.3),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.2),transparent_40%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-cyan-200 uppercase">
              <Shield className="h-3.5 w-3.5" /> Citizen Portal
            </p>
            <h1 className="text-2xl font-black tracking-tight">Sign in to CyberShield</h1>
            <p className="text-sm text-slate-400">Submit complaints, track cases, access safety resources.</p>
          </div>

          <Card className="border-slate-700 bg-slate-900/90 text-slate-100">
            <CardContent className="pt-6 space-y-5">
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-100 gap-2 h-11"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                ) : (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-slate-700" />
                <span className="text-xs text-slate-500">or sign in with email</span>
                <div className="flex-1 border-t border-slate-700" />
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In as Citizen"}
                </Button>
              </form>

              <p className="text-center text-xs text-slate-400">
                No account?{" "}
                <Link href="/sign-up/citizen" className="font-semibold text-cyan-300 hover:text-cyan-200">Register</Link>
                <span className="mx-2 text-slate-600">·</span>
                <Link href="/sign-in/officer" className="font-semibold text-emerald-400 hover:text-emerald-300">Officer login</Link>
                <span className="mx-2 text-slate-600">·</span>
                <Link href="/sign-in/admin" className="font-semibold text-violet-400 hover:text-violet-300">Admin login</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
