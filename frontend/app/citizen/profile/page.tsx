"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, Phone, MapPin, Loader2, Save, Pencil, X, UserCircle2 } from "lucide-react";

type Profile = {
  citizen_id: string | null;
  full_name: string;
  email: string;
  mobile_number: string;
  state_code: string;
  preferred_language: string;
};
type EditForm = { full_name: string; mobile_number: string; state_code: string; preferred_language: string; };

export default function CitizenProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({ full_name: "", mobile_number: "", state_code: "", preferred_language: "en" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: up } = await supabase.from("user_profiles").select("full_name, email, citizen_id").eq("auth_subject", user.id).maybeSingle();
      let c: any = null;
      if (up?.citizen_id) {
        const { data } = await supabase.from("citizens").select("mobile_number, state_code, preferred_language").eq("citizen_id", up.citizen_id).maybeSingle();
        c = data;
      }
      const p: Profile = {
        citizen_id: up?.citizen_id ?? null,
        full_name: up?.full_name ?? "",
        email: up?.email ?? user.email ?? "",
        mobile_number: c?.mobile_number ?? "",
        state_code: c?.state_code ?? "",
        preferred_language: c?.preferred_language ?? "en",
      };
      setProfile(p);
      setForm({ full_name: p.full_name, mobile_number: p.mobile_number, state_code: p.state_code, preferred_language: p.preferred_language });
    } catch { toast.error("Failed to load profile"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!form.full_name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error: upErr } = await supabase.from("user_profiles").update({ full_name: form.full_name.trim() }).eq("auth_subject", user.id);
      if (upErr) throw new Error(upErr.message);
      if (profile?.citizen_id) {
        const { error: cErr } = await supabase.from("citizens").update({
          full_name: form.full_name.trim(),
          state_code: form.state_code.trim().toUpperCase().slice(0, 5) || null,
          preferred_language: form.preferred_language || "en",
        }).eq("citizen_id", profile.citizen_id);
        if (cErr) throw new Error(cErr.message);
      }
      setProfile(p => p ? { ...p, ...form, full_name: form.full_name.trim() } : p);
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-cyan-500" /></div>;

  const initials = (profile?.full_name || "CI").split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{editing ? "Edit your details." : "View your account details."}</p>
        </div>
        {!editing
          ? <Button onClick={() => setEditing(true)} variant="outline" className="gap-2 rounded-xl"><Pencil className="w-4 h-4" /> Edit Profile</Button>
          : <Button onClick={() => setEditing(false)} variant="ghost" className="gap-2 rounded-xl text-slate-500"><X className="w-4 h-4" /> Cancel</Button>}
      </div>

      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl font-bold shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white truncate">{profile?.full_name || "—"}</p>
          <p className="text-sm text-cyan-100 truncate">{profile?.email}</p>
          <Badge className="mt-2 bg-white/20 text-white border-white/30 text-[10px] uppercase font-bold hover:bg-white/20">Citizen</Badge>
        </div>
        <Shield className="w-8 h-8 text-white/20 shrink-0" />
      </div>

      {editing && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-cyan-200 dark:border-cyan-900 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2"><Pencil className="w-4 h-4 text-cyan-500" /><h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Edit Details</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" />
            </div>
            <div className="space-y-1.5">
              <Label>State Code</Label>
              <Input value={form.state_code} onChange={e => setForm(f => ({ ...f, state_code: e.target.value }))} placeholder="e.g. MH" maxLength={5} />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Language</Label>
              <select value={form.preferred_language} onChange={e => setForm(f => ({ ...f, preferred_language: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="mr">Marathi</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={() => setEditing(false)} variant="ghost" className="rounded-xl text-slate-500">Cancel</Button>
          </div>
        </div>
      )}

      {!editing && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          <div className="px-6 py-4"><h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Details</h2></div>
          {[
            { icon: UserCircle2, label: "Full Name", value: profile?.full_name },
            { icon: Mail, label: "Email", value: profile?.email },
            { icon: Phone, label: "Mobile", value: profile?.mobile_number },
            { icon: MapPin, label: "State", value: profile?.state_code },
            { icon: Shield, label: "Language", value: profile?.preferred_language?.toUpperCase() },
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
