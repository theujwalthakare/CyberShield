"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type FormData = { fullName: string; email: string; organization: string; password: string; confirmPassword: string; };

function OtpStep({ email, formData, onBack }: {
  email: string;
  formData: FormData;
  onBack: () => void;
}) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: "email",
      });
      if (verifyError || !verifyData.user) {
        setError(verifyError?.message ?? "Invalid or expired code. Please try again.");
        return;
      }

      const { error: profileErr } = await supabase.from("user_profiles").insert({
        auth_subject: verifyData.user.id,
        role: "pending_analyst",
        email: formData.email,
        full_name: formData.fullName,
      });

      if (profileErr) {
        setError("Account verified but profile setup failed: " + profileErr.message);
        return;
      }

      await supabase.auth.signOut();
      router.replace("/sign-in/analyst");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
        A 6-digit code was sent to <span className="font-semibold">{email}</span>. Check your inbox and spam folder.
      </div>
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="text-center text-xl tracking-[0.5em] font-mono"
            required
          />
        </div>
        {error && <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        <Button className="w-full bg-violet-700 hover:bg-violet-600" type="submit" disabled={submitting || otp.length < 6}>
          {submitting ? "Verifying..." : "Verify & Submit Registration"}
        </Button>
        <button type="button" onClick={onBack} className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors">
          ← Back to registration
        </button>
      </form>
    </div>
  );
}

export default function AnalystSignUpPage() {
  const [form, setForm] = useState<FormData>({ fullName: "", email: "", organization: "", password: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { role: "pending_analyst", full_name: form.fullName } },
      });
      if (authError) { setError(authError.message); return; }
      if (!authData.user) { setError("Signup failed. Please try again."); return; }

      // Auto-confirmed (email confirmation disabled in Supabase)
      if (authData.session) {
        await supabase.from("user_profiles").insert({
          auth_subject: authData.user.id, role: "pending_analyst",
          email: form.email, full_name: form.fullName,
        });
        await supabase.auth.signOut();
        window.location.href = "/sign-in/analyst";
        return;
      }

      setPendingEmail(form.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.2),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(109,40,217,0.15),transparent_40%)]" />
      <main className="relative mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <section className="mb-6 rounded-2xl border border-violet-500/20 bg-slate-900/75 p-6 backdrop-blur">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-violet-200 uppercase">
            <Activity className="h-3.5 w-3.5" /> Analyst Registration
          </p>
          <h1 className="text-2xl font-black tracking-tight">Intelligence Analyst Account</h1>
          <p className="mt-1 text-sm text-slate-400">Requires admin activation before access is granted.</p>
        </section>

        <Card className="border-slate-700 bg-slate-900/90 text-slate-100">
          <CardContent className="pt-6">
            {pendingEmail ? (
              <OtpStep email={pendingEmail} formData={form} onBack={() => setPendingEmail(null)} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Your full name" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="analyst@agency.gov.in" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Organization / Agency</Label>
                  <Input value={form.organization} onChange={e => set("organization", e.target.value)} placeholder="e.g. CERT-In, State Cyber Cell" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Input type={showPwd ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} minLength={8} required />
                      <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm Password *</Label>
                    <Input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} minLength={8} required />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Analyst accounts require admin activation before access is granted.</p>
                {error && <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                <Button className="w-full bg-violet-700 hover:bg-violet-600" type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Register as Analyst"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/sign-in/analyst" className="font-semibold text-violet-300 hover:text-violet-200">Sign in</Link>
          <span className="mx-2 text-slate-600">·</span>
          <Link href="/sign-up/officer" className="font-semibold text-emerald-400 hover:text-emerald-300">Officer signup</Link>
        </p>
      </main>
    </div>
  );
}
