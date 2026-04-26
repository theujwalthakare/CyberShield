"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Mail, Hash, MapPin, Building2,
  Loader2, Save, Pencil, X, UserCircle2,
  Phone, KeyRound, CheckCircle2,
} from "lucide-react";

type Profile = {
  user_id: string;
  officer_id: string | null;
  full_name: string;
  email: string;
  role: string;
  badge_number: string;
  mobile_number: string;
  police_station: string;
  district_code: string;
  state_code: string;
  officer_role: string;
  is_active: boolean;
};

type EditForm = {
  full_name: string;
  police_station: string;
  district_code: string;
  state_code: string;
  mobile_number: string;
};

const EMPTY_FORM: EditForm = {
  full_name: "",
  police_station: "",
  district_code: "",
  state_code: "",
  mobile_number: "",
};

export default function OfficerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: up, error: upErr } = await supabase
        .from("user_profiles")
        .select("user_id, full_name, email, role, officer_id")
        .eq("auth_subject", user.id)
        .maybeSingle();

      if (upErr) throw new Error(upErr.message);

      let o: any = null;
      if (up?.officer_id) {
        const { data } = await supabase
          .from("officers")
          .select("badge_number, mobile_number, police_station, district_code, state_code, role, is_active")
          .eq("officer_id", up.officer_id)
          .maybeSingle();
        o = data;
      }

      const p: Profile = {
        user_id: up?.user_id ?? "",
        officer_id: up?.officer_id ?? null,
        full_name: up?.full_name ?? "",
        email: up?.email ?? user.email ?? "",
        role: up?.role ?? "officer",
        badge_number: o?.badge_number ?? "",
        mobile_number: o?.mobile_number ?? "",
        police_station: o?.police_station ?? "",
        district_code: o?.district_code ?? "",
        state_code: o?.state_code ?? "",
        officer_role: o?.role ?? "",
        is_active: o?.is_active ?? true,
      };
      setProfile(p);
      setForm({
        full_name: p.full_name,
        police_station: p.police_station,
        district_code: p.district_code,
        state_code: p.state_code,
        mobile_number: p.mobile_number,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit() {
    if (!profile) return;
    setForm({
      full_name: profile.full_name,
      police_station: profile.police_station,
      district_code: profile.district_code,
      state_code: profile.state_code,
      mobile_number: profile.mobile_number,
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function handleSave() {
    if (!form.full_name.trim()) { toast.error("Full name is required"); return; }
    if (!profile) return;
    setSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update user_profiles
      const { error: upErr } = await supabase
        .from("user_profiles")
        .update({ full_name: form.full_name.trim() })
        .eq("auth_subject", user.id);
      if (upErr) throw new Error(upErr.message);

      // Update officers table if officer_id exists
      if (profile.officer_id) {
        const { error: oErr } = await supabase
          .from("officers")
          .update({
            full_name: form.full_name.trim(),
            mobile_number: form.mobile_number.trim() || profile.mobile_number,
            police_station: form.police_station.trim() || null,
            district_code: form.district_code.trim().toUpperCase() || profile.district_code,
            state_code: form.state_code.trim().toUpperCase().slice(0, 5) || profile.state_code,
          })
          .eq("officer_id", profile.officer_id);
        if (oErr) throw new Error(oErr.message);
      }

      setProfile(p => p ? {
        ...p,
        full_name: form.full_name.trim(),
        mobile_number: form.mobile_number.trim() || p.mobile_number,
        police_station: form.police_station.trim(),
        district_code: form.district_code.trim().toUpperCase(),
        state_code: form.state_code.trim().toUpperCase().slice(0, 5),
      } : p);

      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-teal-400" />
      </div>
    );
  }

  const initials = (profile?.full_name || "OF")
    .split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {editing ? "Edit your officer account details." : "View your officer account details."}
          </p>
        </div>
        {!editing ? (
          <Button onClick={startEdit} variant="outline" className="gap-2 rounded-xl">
            <Pencil className="w-4 h-4" /> Edit Profile
          </Button>
        ) : (
          <Button onClick={cancelEdit} variant="ghost" className="gap-2 rounded-xl text-slate-500">
            <X className="w-4 h-4" /> Cancel
          </Button>
        )}
      </div>

      {/* Avatar card */}
      <div className="bg-[#0a1929] rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-400/40 flex items-center justify-center text-teal-300 text-xl font-bold shrink-0 select-none">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-white truncate">{profile?.full_name || "—"}</p>
          <p className="text-sm text-slate-400 truncate">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px] uppercase font-bold hover:bg-teal-500/20">
              {profile?.officer_role || profile?.role || "Officer"}
            </Badge>
            {profile?.badge_number && (
              <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-[10px] font-mono hover:bg-slate-700">
                {profile.badge_number}
              </Badge>
            )}
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${profile?.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${profile?.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
              {profile?.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <Shield className="w-8 h-8 text-teal-400/20 shrink-0" />
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200 dark:border-teal-900 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Pencil className="w-4 h-4 text-teal-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Edit Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Inspector Full Name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <Input
                id="mobile_number"
                value={form.mobile_number}
                onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                maxLength={15}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="police_station">Police Station</Label>
              <Input
                id="police_station"
                value={form.police_station}
                onChange={e => setForm(f => ({ ...f, police_station: e.target.value }))}
                placeholder="e.g. Andheri West PS"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="district_code">District Code</Label>
              <Input
                id="district_code"
                value={form.district_code}
                onChange={e => setForm(f => ({ ...f, district_code: e.target.value }))}
                placeholder="e.g. MUM-W"
                maxLength={10}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state_code">State Code</Label>
              <Input
                id="state_code"
                value={form.state_code}
                onChange={e => setForm(f => ({ ...f, state_code: e.target.value }))}
                placeholder="e.g. MH"
                maxLength={5}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={cancelEdit} variant="ghost" className="rounded-xl text-slate-500">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Read-only view */}
      {!editing && (
        <>
          {/* Account info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            <div className="px-6 py-4">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account</h2>
            </div>
            {[
              { icon: UserCircle2, label: "Full Name", value: profile?.full_name },
              { icon: Mail, label: "Email", value: profile?.email },
              { icon: Phone, label: "Mobile", value: profile?.mobile_number },
              { icon: KeyRound, label: "Role", value: profile?.role?.toUpperCase() },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white text-right max-w-[200px] truncate">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Officer details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Officer Details</h2>
              {profile?.is_active && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Verified Officer
                </span>
              )}
            </div>
            {[
              { icon: Hash, label: "Badge Number", value: profile?.badge_number },
              { icon: Building2, label: "Police Station", value: profile?.police_station },
              { icon: MapPin, label: "District Code", value: profile?.district_code },
              { icon: MapPin, label: "State Code", value: profile?.state_code },
              { icon: UserCircle2, label: "Designation", value: profile?.officer_role },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white text-right max-w-[200px] truncate">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
