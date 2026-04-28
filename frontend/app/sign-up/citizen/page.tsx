"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldPlus, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type FormData = {
  fullName: string; email: string; phone: string;
  stateCode: string; gender: string; password: string; confirmPassword: string;
};

function OtpStep({ email, formData, onBack }: {
  email: string;
  formData: FormData;
  onBack: () => void;
}) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // Verify OTP — this creates the session
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: "email",
      });
      if (verifyError || !verifyData.user) {
        setError(verifyError?.message ?? "Invalid or expired code. Please try again.");
        return;
      }

      const user = verifyData.user;

      // Now insert DB records — user is authenticated, RLS will pass
      const { data: citizenData, error: citizenErr } = await supabase
        .from("citizens")
        .insert({
          mobile_number: formData.phone,
          full_name: formData.fullName,
          state_code: formData.stateCode || null,
          mobile_verified: false,
        })
        .select("citizen_id")
        .single();

      if (citizenErr) {
        setError("Account verified but profile setup failed: " + citizenErr.message);
        return;
      }

      const { error: profileErr } = await supabase.from("user_profiles").insert({
        auth_subject: user.id,
        role: "citizen",
        email: formData.email,
        full_name: formData.fullName,
        citizen_id: citizenData?.citizen_id ?? null,
      });

      if (profileErr) {
        setError("Account verified but profile setup failed: " + profileErr.message);
        return;
      }

      await supabase.auth.signOut();
      router.replace("/sign-in/citizen");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
        A 6-digit code was sent to <span className="font-semibold">{email}</span>. Check your inbox and spam folder.
      </div>
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="text-center text-xl tracking-[0.5em] font-mono"
            required
          />
        </div>
        {error && <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        <Button className="w-full bg-cyan-600 hover:bg-cyan-500" type="submit" disabled={isSubmitting || otp.length < 6}>
          {isSubmitting ? "Verifying..." : "Verify & Create Account"}
        </Button>
        <button type="button" onClick={onBack} className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors">
          ← Back to registration
        </button>
      </form>
    </div>
  );
}

export default function CitizenSignUpPage() {
  const [form, setForm] = useState<FormData>({
    fullName: "", email: "", phone: "", stateCode: "", gender: "", password: "", confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  function set(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
  }

  async function handleGoogleSignUp() {
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
      setError(err instanceof Error ? err.message : "Google sign-up failed.");
      setIsGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (!form.phone.trim()) { setError("Mobile number is required."); return; }
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      // Only create auth user — DB inserts happen after OTP verification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { role: "citizen", full_name: form.fullName } },
      });
      if (authError) { setError(authError.message); return; }
      if (!authData.user) { setError("Signup failed. Please try again."); return; }

      // If email confirmation is disabled in Supabase, user is immediately confirmed
      if (authData.session) {
        // Auto-confirmed — insert records now
        const { data: citizenData } = await supabase.from("citizens").insert({
          mobile_number: form.phone, full_name: form.fullName,
          state_code: form.stateCode || null, mobile_verified: false,
        }).select("citizen_id").single();

        await supabase.from("user_profiles").insert({
          auth_subject: authData.user.id, role: "citizen",
          email: form.email, full_name: form.fullName,
          citizen_id: citizenData?.citizen_id ?? null,
        });

        await supabase.auth.signOut();
        window.location.href = "/sign-in/citizen";
        return;
      }

      // Email confirmation required — show OTP step
      setPendingEmail(form.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(8,145,178,0.3),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.2),transparent_40%)]" />
      <main className="relative mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <section className="mb-6 rounded-2xl border border-cyan-500/20 bg-slate-900/75 p-6 backdrop-blur">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-cyan-200 uppercase">
            <Shield className="h-3.5 w-3.5" /> Citizen Registration
          </p>
          <h1 className="text-2xl font-black tracking-tight">Create Citizen Account</h1>
          <p className="mt-1 text-sm text-slate-400">Submit complaints, track case status, and access safety resources.</p>
        </section>

        <Card className="border-slate-700 bg-slate-900/90 text-slate-100">
          <CardContent className="pt-6">
            {pendingEmail ? (
              <OtpStep email={pendingEmail} formData={form} onBack={() => setPendingEmail(null)} />
            ) : (
              <div className="space-y-5">
                <Button type="button" variant="outline"
                  className="w-full border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-100 gap-2 h-11"
                  onClick={handleGoogleSignUp} disabled={isGoogleLoading}>
                  {isGoogleLoading
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                    : <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>}
                  Continue with Google
                </Button>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 border-t border-slate-700" />
                  <span className="text-xs text-slate-500">or register with email</span>
                  <div className="flex-1 border-t border-slate-700" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label>Full Name *</Label>
                      <Input value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="As per Aadhaar / ID" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email *</Label>
                      <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mobile *</Label>
                      <Input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>State Code</Label>
                      <Input value={form.stateCode} onChange={e => set("stateCode", e.target.value)} placeholder="e.g. MH, DL" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Gender</Label>
                      <Select value={form.gender} onValueChange={v => set("gender", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Password *</Label>
                      <div className="relative">
                        <Input type={showPwd ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} minLength={8} required />
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Confirm Password *</Label>
                      <Input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} minLength={8} required />
                    </div>
                  </div>
                  {error && <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-500" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : "Register as Citizen"}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/sign-in/citizen" className="font-semibold text-cyan-300 hover:text-cyan-200">Sign in</Link>
          <span className="mx-2 text-slate-600">·</span>
          <Link href="/sign-up/officer" className="font-semibold text-emerald-400 hover:text-emerald-300">Officer signup</Link>
        </p>
      </main>
    </div>
  );
}
