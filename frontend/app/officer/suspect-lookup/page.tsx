"use client";

import { useState } from "react";
import {
  Search, UserMinus, AlertTriangle, Fingerprint, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";

type SearchResult = {
  identifier: string;
  type: string;
  riskScore: number;
  status: string;
  totalLoss: number;
  linkedCases: number;
  states: string[];
  isMHA: boolean;
};

const ENTITY_TYPE_MAP: Record<string, string> = {
  phone: "PHONE",
  upi: "UPI_ID",
  account: "BANK_ACCOUNT",
  ip: "IP_ADDRESS",
  email: "EMAIL",
};

export default function SuspectLookupPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("complaint_entities")
        .select("entity_value, entity_type, mha_fraud_flag, complaint_id, complaints ( financial_loss_amount, state_code )")
        .eq("entity_value", query.trim())
        .eq("entity_type", ENTITY_TYPE_MAP[type] ?? "PHONE");

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) { setNotFound(true); return; }

      const isMHA = data.some((d: any) => d.mha_fraud_flag);
      const totalLoss = data.reduce((sum: number, d: any) => sum + ((d.complaints as any)?.financial_loss_amount || 0), 0);
      const states = Array.from(new Set(data.map((d: any) => (d.complaints as any)?.state_code).filter(Boolean))) as string[];

      setResult({
        identifier: query.trim(),
        type,
        riskScore: isMHA ? 95 : data.length > 2 ? 75 : 40,
        status: isMHA ? "MHA FLAGGED" : data.length > 2 ? "REPEATED SUSPECT" : "UNDER INVESTIGATION",
        totalLoss,
        linkedCases: data.length,
        states: states.length > 0 ? states : ["UNKNOWN"],
        isMHA,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-4">
      <div className="text-center max-w-2xl mx-auto">
        <Fingerprint className="w-12 h-12 text-slate-800 dark:text-slate-200 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">National Suspect Database</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Cross-reference identifiers across NCRP and telecom blacklists.
        </p>
      </div>

      <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-xl max-w-3xl mx-auto">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={type} onValueChange={v => setType(v ?? "phone")}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 dark:bg-slate-800">
                <SelectValue placeholder="Identifier Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone Number</SelectItem>
                <SelectItem value="upi">UPI ID</SelectItem>
                <SelectItem value="account">Bank Account</SelectItem>
                <SelectItem value="ip">IP Address</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={`Enter ${type} to search...`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 w-full sm:w-auto"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Search className="w-4 h-4 mr-2" />Search</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {notFound && !loading && (
        <Card className="max-w-3xl mx-auto border-dashed border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-center py-10 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-red-800 dark:text-red-300">No matching threat actors found.</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            This identifier is not currently tracked.
          </p>
        </Card>
      )}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 shadow-sm">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4 border-4 border-white dark:border-slate-900 shadow-sm">
                <UserMinus className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <Badge className="bg-red-600 text-white border-0 px-3 py-1 mb-2 hover:bg-red-700">
                {result.status}
              </Badge>
              <h2 className="text-xl font-mono font-bold text-slate-900 dark:text-white break-all">
                {result.identifier}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mt-1">{result.type} Record</p>
              <div className="mt-6 w-full space-y-3">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-red-100 dark:border-red-900 flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-500 uppercase">Risk Score</p>
                  <p className="text-xl font-black text-red-600 dark:text-red-400">{result.riskScore}/100</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-red-100 dark:border-red-900 text-left">
                  <p className="text-xs font-bold text-slate-500 uppercase">Financial Impact</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    ₹{result.totalLoss.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="border-b bg-slate-50 dark:bg-slate-950 pb-4">
                <CardTitle className="text-lg text-slate-900 dark:text-white">Federated Search Results</CardTitle>
                <CardDescription>Records extracted from live complaint entities table.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 border-b dark:border-slate-800 pb-2">
                    Active Linkages
                  </h4>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.linkedCases}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase mt-1">Linked Cases</p>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{result.states[0]}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase mt-1">Primary State</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 border-b dark:border-slate-800 pb-2">
                    Database Activity
                  </h4>
                  <div className="space-y-3">
                    {[
                      {
                        db: "NCRP (Cyber Portal)",
                        match: true,
                        note: `Reported in ${result.linkedCases} complaint(s) in DB`,
                      },
                      {
                        db: "MHA Fraud Registry",
                        match: result.isMHA,
                        note: result.isMHA
                          ? "Entity verified as fraudulent by MHA"
                          : "Not currently flagged.",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        {item.match
                          ? <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          : <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 shrink-0 mt-0.5" />}
                        <div>
                          <p className={`text-sm font-bold ${item.match ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                            {item.db}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{item.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
