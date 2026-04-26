"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function OtpStep({ email, onBack }: { email: string; onBack: () => void }) {
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
      const { error } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: "signup" });
      if (error) { setError(error.message); return; }
      await supabase.auth.signOut();
      router.replace("/sign-in/officer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        A 6-digit code was sent to <span className="font-semibold">{email}</span>. Check your inbox.
      </div>
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)}
            placeholder="123456" maxLength={6}
            className="text-center text-xl tracking-[0.5em] font-mono" required />
        </div>
        {error && <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        <Button className="w-full bg-emerald-700 hover:bg-emerald-600" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify & Go to Sign In"}
        </Button>
        <button type="button" onClick={onBack} className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors">
          ← Back to registration
        </button>
      </form>
    </div>
  );
}

export default function OfficerSignUpPage() {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", badgeNumber: "",
    role: "", policeStation: "", districtCode: "", stateCode: "",
    password: "", confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  function set(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (!form.role) { setError("Please select a designation."); return; }
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { role: "pending_officer", full_name: form.fullName } },
      });
      if (authError || !authData.user) { setError(authError?.message ?? "Signup failed."); return; }

      const { data: officerData } = await supabase.from("officers").insert({
        badge_number: form.badgeNumber, full_name: form.fullName,
        mobile_number: form.phone, role: form.role,
        state_code: form.stateCode || null, district_code: form.districtCode || null,
        police_station: form.policeStation || null,
        keycloak_id: authData.user.id,
        is_active: false,
      }).select("officer_id").single();

      await supabase.from("user_profiles").insert({
        auth_subject: authData.user.id, role: "pending_officer",
        email: form.email, full_name: form.fullName,
        officer_id: officerData?.officer_id ?? null,
      });

      setPendingEmail(form.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(22,163,74,0.2),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.15),transparent_40%)]" />

      <main className="relative mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <section className="mb-6 rounded-2xl border border-emerald-500/20 bg-slate-900/75 p-6 backdrop-blur">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-200 uppercase">
            <UserCheck className="h-3.5 w-3.5" /> Officer Registration
          </p>
          <h1 className="text-2xl font-black tracking-tight">Law Enforcement Officer Account</h1>
          <p className="mt-1 text-sm text-slate-400">
            Access case files, evidence, analytics, and intelligence reports. Requires admin activation.
          </p>
        </section>

        <Card className="border-slate-700 bg-slate-900/90 text-slate-100">
          <CardContent className="pt-6">
            {pendingEmail ? (
              <OtpStep email={pendingEmail} onBack={() => setPendingEmail(null)} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="o-name">Full Name *</Label>
                    <Input id="o-name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="As per service record" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="o-email">Official Email *</Label>
                    <Input id="o-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="officer@police.gov.in" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="o-phone">Mobile *</Label>
                    <Input id="o-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="o-badge">Badge / Service No. *</Label>
                    <Input id="o-badge" value={form.badgeNumber} onChange={(e) => set("badgeNumber", e.target.value)} placeholder="e.g. MH-CID-2024-001" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="o-role">Designation *</Label>
                    <Select value={form.role} onValueChange={(v) => set("role", v)}>
                      <SelectTrigger id="o-role"><SelectValue placeholder="Select rank" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONSTABLE">Constable</SelectItem>
                        <SelectItem value="SUB_INSPECTOR">Sub Inspector</SelectItem>
                        <SelectItem value="INSPECTOR">Inspector</SelectItem>
                        <SelectItem value="DSP">Deputy Superintendent</SelectItem>
                        <SelectItem value="SP">Superintendent of Police</SelectItem>
                        <SelectItem value="CYBER_ANALYST">Cyber Analyst</SelectItem>
                        <SelectItem value="INVESTIGATING_OFFICER">Investigating Officer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="o-station">Police Station</Label>
                    <Input id="o-station" value={form.policeStation} onChange={(e) => set("policeStation", e.target.value)} placeholder="e.g. Cyber Crime Cell" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="o-district">District Code *</Label>
                    <Input id="o-district" value={form.districtCode} onChange={(e) => set("districtCode", e.target.value)} placeholder="e.g. PUNE" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="o-state">State Code *</Label>
                    <Input id="o-state" value={form.stateCode} onChange={(e) => set("stateCode", e.target.value)} placeholder="e.g. MH, DL" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="o-pwd">Password *</Label>
                    <div className="relative">
                      <Input id="o-pwd" type={showPwd ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} minLength={8} required />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="o-cpwd">Confirm Password *</Label>
                    <Input id="o-cpwd" type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} minLength={8} required />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Officer accounts require admin activation within 24 hours.</p>
                {error && <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                <Button className="w-full bg-emerald-700 hover:bg-emerald-600" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting registration..." : "Register as Officer"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/sign-in/officer" className="font-semibold text-cyan-300 hover:text-cyan-200">Sign in</Link>
          <span className="mx-2 text-slate-600">·</span>
          <Link href="/sign-up/citizen" className="font-semibold text-cyan-400 hover:text-cyan-300">Citizen signup</Link>
        </p>
      </main>
    </div>
  );
}
