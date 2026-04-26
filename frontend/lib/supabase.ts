import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

// Re-export the singleton browser client so lib/api.ts and other
// client-side modules share one GoTrueClient instance.
export const supabase = getSupabaseBrowserClient();

// Query helpers for common operations
export async function queryIntelligence(query: {
  sector?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
}) {
  let q = supabase.from("intelligence_reports").select("*");

  if (query.sector) {
    q = q.eq("category", query.sector);
  }
  if (query.state) {
    q = q.eq("city", query.state);
  }
  if (query.startDate) {
    q = q.gte("day", query.startDate);
  }
  if (query.endDate) {
    q = q.lte("day", query.endDate);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function queryCases(query: { limit?: number; offset?: number }) {
  const limit = query.limit || 100;
  const offset = query.offset || 0;
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function queryAlerts() {
  const { data, error } = await supabase.from("alerts").select("*");
  if (error) throw error;
  return data || [];
}

export async function queryRiskAreas() {
  const { data, error } = await supabase.from("risk_areas").select("*");
  if (error) throw error;
  return data || [];
}

export async function queryIncidents() {
  const { data, error } = await supabase.from("incidents").select("*");
  if (error) throw error;
  return data || [];
}

export async function queryAnalytics(type: "trends" | "loss-summary") {
  const table = type === "trends" ? "analytics_trends" : "analytics_loss";
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw error;
  return data || [];
}

export async function queryKnowledgeBase() {
  const { data, error } = await supabase.from("knowledge_base").select("*");
  if (error) throw error;
  return data || [];
}

export async function queryAttackCategories() {
  const { data, error } = await supabase
    .from("attack_categories")
    .select("*");
  if (error) throw error;
  return data || [];
}
