"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ShieldCheck, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/sign-in"); return; }
      setEmail(user.email ?? "");
      supabase
        .from("user_profiles")
        .select("role")
        .eq("auth_subject", user.id)
        .maybeSingle()
        .then(({ data }: { data: { role: string } | null }) => setRole(data?.role ?? "officer"));
    });
  }, [router]);

  async function handleCheckStatus() {
    setChecking(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/sign-in"); return; }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, officer_id")
        .eq("auth_subject", user.id)
        .maybeSingle();

      if (!profile) { router.replace("/sign-in"); return; }

      if (profile.officer_id) {
        const { data: officer } = await supabase
          .from("officers")
          .select("is_active")
          .eq("officer_id", profile.officer_id)
          .maybeSingle();
        if (officer?.is_active) { router.replace("/officer/dashboard"); return; }
      }

      if (profile.role === "analyst") { router.replace("/analyst/dashboard"); return; }

      alert("Your account is still pending admin approval. Please check back later.");
    } finally {
      setChecking(false);
    }
  }

  async function handleSignOut() {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/sign-in");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Account Pending Approval</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Your <span className="text-amber-300 font-semibold capitalize">{role}</span> account
            {email && <> for <span className="text-slate-200 font-medium">{email}</span></>} has been
            registered and is awaiting admin activation.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">What happens next?</h2>
          {[
            { icon: ShieldCheck, text: "An administrator will review your credentials and service details.", color: "text-cyan-400" },
            { icon: Clock, text: "Activation typically happens within 24 hours on working days.", color: "text-amber-400" },
            { icon: RefreshCw, text: "Click \"Check Status\" below to see if your account has been approved.", color: "text-emerald-400" },
          ].map(({ icon: Icon, text, color }, i) => (
            <div key={i} className="flex items-start gap-3">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
              <p className="text-sm text-slate-400">{text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl gap-2"
          >
            {checking
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Checking...</>
              : <><RefreshCw className="w-4 h-4" /> Check Approval Status</>}
          </Button>
          <Button onClick={handleSignOut} variant="ghost" className="w-full text-slate-400 hover:text-white rounded-xl gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>

        <p className="text-xs text-slate-600">
          If you have questions, contact your system administrator.
        </p>
      </div>
    </div>
  );
}
