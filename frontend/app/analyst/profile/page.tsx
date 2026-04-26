"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, KeyRound, Loader2, Save, Pencil, X, UserCircle2, Activity } from "lucide-react";

type Profile = { full_name: string; email: string; role: string; };

export default function AnalystProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_profiles").select("full_name, email, role").eq("auth_subject", user.id).maybeSingle();
      const p = { full_name: data?.full_name ?? "", email: data?.email ?? user.email ?? "", role: data?.role ?? "analyst" };
      setProfile(p);
      setFullName(p.full_name);
    } catch { toast.error("Failed to load profile"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!fullName.trim()) { toast.error("Name cannot be empty"); return; }
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("user_profiles").update({ full_name: fullName.trim() }).eq("auth_subject", user.id);
      if (error) throw new Error(error.message);
      setProfile(p => p ? { ...p, full_name: fullName.trim() } : p);
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-violet-400" /></div>;

  const initials = (profile?.full_name || "AN").split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{editing ? "Edit your analyst account details." : "View your analyst account details."}</p>
        </div>
        {!editing
          ? <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 rounded-xl"><Pencil className="w-4 h-4" /> Edit Profile</Button>
          : <Button onClick={() => setEditing(false)} variant="ghost" className="gap-2 rounded-xl text-slate-500"><X className="w-4 h-4" /> Cancel</Button>}
      </div>

      <div className="bg-slate-950 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-violet-500/20 border-2 border-violet-400/40 flex items-center justify-center text-violet-300 text-xl font-bold shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white truncate">{profile?.full_name || "—"}</p>
          <p className="text-sm text-slate-400 truncate">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px] uppercase font-bold hover:bg-violet-500/20">Intelligence Analyst</Badge>
          </div>
        </div>
        <Activity className="w-8 h-8 text-violet-400/20 shrink-0" />
      </div>

      {editing && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-violet-200 dark:border-violet-900 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2"><Pencil className="w-4 h-4 text-violet-500" /><h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Edit Details</h2></div>
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Analyst name" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={() => setEditing(false)} variant="ghost" className="rounded-xl text-slate-500">Cancel</Button>
          </div>
        </div>
      )}

      {!editing && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          <div className="px-6 py-4"><h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account</h2></div>
          {[
            { icon: UserCircle2, label: "Full Name", value: profile?.full_name },
            { icon: Mail, label: "Email", value: profile?.email },
            { icon: KeyRound, label: "Role", value: "INTELLIGENCE ANALYST" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400"><Icon className="w-4 h-4 shrink-0" />{label}</div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{value || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
