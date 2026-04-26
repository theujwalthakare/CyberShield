"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCaseFromReport } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CRIME_TYPES = [
  "PHISHING", "FINANCIAL_FRAUD", "IDENTITY_THEFT", "RANSOMWARE",
  "CYBERSTALKING", "HACKING", "ONLINE_SCAM", "DATA_BREACH",
  "UPI_FRAUD", "SOCIAL_MEDIA_FRAUD", "OTHER",
];

export default function FileComplaintPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    crime_type: "",
    description: "",
    financial_loss_amount: "",
    incident_date: "",
    district: "",
    state: "",
  });

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.crime_type) { toast.error("Please select a crime type"); return; }
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); return; }

      const { case_number } = await createCaseFromReport({
        crime_type: form.crime_type,
        description: form.description || undefined,
        financial_loss: form.financial_loss_amount ? parseFloat(form.financial_loss_amount) : 0,
        incident_date: form.incident_date || undefined,
        district: form.district || undefined,
        state: form.state || undefined,
        authSubject: user.id,
      });

      toast.success(`Complaint ${case_number.slice(0, 8).toUpperCase()} filed successfully`);
      router.push("/citizen/my-complaints");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">File a Complaint</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Report a cybercrime incident. Fields marked * are required.</p>
      </div>

      <form onSubmit={onSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="crime_type">Crime Type *</Label>
          <select
            id="crime_type"
            value={form.crime_type}
            onChange={e => set("crime_type", e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Select crime type...</option>
            {CRIME_TYPES.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description *</Label>
          <textarea
            id="description"
            value={form.description}
            onChange={e => set("description", e.target.value)}
            rows={4}
            required
            placeholder="Describe what happened in detail..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="financial_loss_amount">Financial Loss (₹)</Label>
            <Input
              id="financial_loss_amount"
              type="number"
              min="0"
              step="1"
              value={form.financial_loss_amount}
              onChange={e => set("financial_loss_amount", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="incident_date">Incident Date</Label>
            <Input
              id="incident_date"
              type="date"
              value={form.incident_date}
              onChange={e => set("incident_date", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="district">District</Label>
            <Input
              id="district"
              value={form.district}
              onChange={e => set("district", e.target.value)}
              placeholder="e.g. Mumbai"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={form.state}
              onChange={e => set("state", e.target.value)}
              placeholder="e.g. MH"
              maxLength={5}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl">
            {submitting ? "Submitting..." : "Submit Complaint"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="rounded-xl">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
