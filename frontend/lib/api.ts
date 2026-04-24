import { supabase } from "./supabase";

export type RiskArea = {
  area_code: string;
  score: number;
  risk_level: string;
};

export type AlertItem = {
  id: number;
  alert_type: string;
  area_code: string;
  severity: string;
  message: string;
  status: string;
  created_at?: string | null;
};

export type CaseItem = {
  id: string;
  case_number: string;
  title: string;
  description: string;
  crime_type: string;
  crime_subtype: string | null;
  incident_date: string | null;
  financial_loss: number;
  currency: string;
  affected_platform: string | null;
  victim_area: string | null;
  district: string | null;
  state: string | null;
  status: string;
  severity_score: number | null;
  ai_confidence: number;
  is_escalated: boolean;
  reporter_id: number | null;
  assigned_officer_id: number | null;
  created_at: string;
  updated_at: string;
};

export type OfficerItem = {
  id: number;
  full_name: string;
  email: string;
  role: string;
};

type CaseQueryOptions = {
  status?: string;
  crime_type?: string;
  sort_by?: "created_at" | "severity";
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

type ReportCaseInput = {
  title?: string;
  description?: string;
  crime_type?: string;
  incident_date?: string;
  financial_loss?: number;
  affected_platform?: string;
  district?: string;
  state?: string;
};

// Intelligence-related types
interface OverviewData {
  total_cases: number;
  total_financial_loss: number;
  avg_loss_per_case: number;
  impacted_sectors: number;
}

interface TrendData {
  Year: number;
  Cases_Reported: number;
  Financial_Loss: number;
}

interface DistributionData {
  crime_type: string;
  count: number;
}

interface DailyData {
  day: number;
  count: number;
}

interface CategoryDistData {
  category: string;
  count: number;
}

interface GeographyData {
  state: string;
  total_cases: number;
  total_financial_loss: number;
}

interface ForecastData {
  Year: number;
  Cases_Reported: number;
  Financial_Loss: number;
  is_forecast: boolean;
  Cases_Predicted_Lower?: number;
  Cases_Predicted_Upper?: number;
}

interface RiskData {
  State: string;
  surge_velocity: number;
  projected_cases: number;
}

const ALLOWED_CASE_STATUSES = new Set([
  "RECEIVED",
  "CLASSIFIED",
  "FREEZE_REQUESTED",
  "ASSIGNED",
  "INVESTIGATION",
  "CHARGESHEET",
  "VERDICT",
]);

function titleFromCategory(value: string | null | undefined): string {
  return String(value ?? "General")
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "RECEIVED").toLowerCase();
}

function toCaseItem(
  row: Record<string, unknown>,
  officerRankByUuid: Map<string, number>
): CaseItem {
  const assignedOfficerUuid = row.assigned_officer_id
    ? String(row.assigned_officer_id)
    : null;

  return {
    id: String(row.complaint_id),
    case_number: String(row.complaint_id),
    title: titleFromCategory(row.crime_category as string | null | undefined),
    description: String(row.raw_description ?? ""),
    crime_type: String(row.crime_category ?? ""),
    crime_subtype: row.crime_subcategory ? String(row.crime_subcategory) : null,
    incident_date: row.incident_datetime ? String(row.incident_datetime) : null,
    financial_loss: Number(row.financial_loss_amount ?? 0),
    currency: "INR",
    affected_platform: null,
    victim_area: row.district_code ? String(row.district_code) : null,
    district: row.district_code ? String(row.district_code) : null,
    state: row.state_code ? String(row.state_code) : null,
    status: normalizeStatus(row.status as string | null | undefined),
    severity_score:
      row.priority_score === null || row.priority_score === undefined
        ? null
        : Number(row.priority_score),
    ai_confidence: Number(row.classification_confidence ?? 0),
    is_escalated: Boolean(row.organized_crime_flag),
    reporter_id: null,
    assigned_officer_id: assignedOfficerUuid
      ? (officerRankByUuid.get(assignedOfficerUuid) ?? null)
      : null,
    created_at: String(row.submitted_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

async function getRankedOfficers() {
  const { data, error } = await supabase
    .from("officers")
    .select("officer_id, full_name, keycloak_id, role, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .order("officer_id", { ascending: true });

  if (error) {
    throw error;
  }

  const ranked = (data ?? []).map((row, index) => ({
    rank: index + 1,
    officer_id: String(row.officer_id),
    full_name: String(row.full_name ?? ""),
    email: String(row.keycloak_id ?? ""),
    role: String(row.role ?? "officer"),
  }));

  const byUuid = new Map<string, number>();
  ranked.forEach((item) => {
    byUuid.set(item.officer_id, item.rank);
  });

  return { ranked, byUuid };
}

async function fetchCaseById(caseId: string): Promise<CaseItem | null> {
  const { byUuid } = await getRankedOfficers();
  const { data, error } = await supabase
    .from("complaints")
    .select(
      "complaint_id, raw_description, crime_category, crime_subcategory, incident_datetime, financial_loss_amount, status, priority_score, classification_confidence, organized_crime_flag, assigned_officer_id, state_code, district_code, submitted_at, updated_at"
    )
    .eq("complaint_id", caseId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return toCaseItem(data as Record<string, unknown>, byUuid);
}

// Supabase-based query functions
export async function fetchIntelligenceOverview(filters: {
  year?: string;
  state?: string;
  crime_type?: string;
  category?: string;
}): Promise<OverviewData> {
  try {
    const pageSize = 1000;
    let from = 0;
    const cases: Array<{ amount_lost_inr?: number | null; category?: string | null }> = [];

    while (true) {
      let query = supabase
        .from("intelligence_reports")
        .select("amount_lost_inr, category")
        .range(from, from + pageSize - 1);

      if (filters.year && filters.year !== "All") {
        const yearNum = parseInt(filters.year);
        query = query.eq("year", yearNum);
      }
      if (filters.state && filters.state !== "All") {
        query = query.eq("city", filters.state);
      }
      if (filters.crime_type && filters.crime_type !== "All") {
        query = query.ilike("incident_type", filters.crime_type);
      }
      if (filters.category && filters.category !== "All") {
        query = query.eq("category", filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      const batch = data || [];
      cases.push(...batch);

      if (batch.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    const totalLoss = cases.reduce((sum, c) => sum + (c.amount_lost_inr || 0), 0);
    const sectors = new Set(cases.map((c) => c.category)).size;

    return {
      total_cases: cases.length,
      total_financial_loss: totalLoss,
      avg_loss_per_case: cases.length > 0 ? totalLoss / cases.length : 0,
      impacted_sectors: sectors,
    };
  } catch (error) {
    console.error("Error fetching intelligence overview:", error);
    return {
      total_cases: 0,
      total_financial_loss: 0,
      avg_loss_per_case: 0,
      impacted_sectors: 0,
    };
  }
}

export async function fetchIntelligenceTrends(filters: {
  year?: string;
  state?: string;
  crime_type?: string;
  category?: string;
}): Promise<TrendData[]> {
  try {
    let query = supabase.from("intelligence_reports").select("*");

    if (filters.year && filters.year !== "All") {
      query = query.eq("year", parseInt(filters.year));
    }
    if (filters.state && filters.state !== "All") {
      query = query.eq("city", filters.state);
    }
    if (filters.crime_type && filters.crime_type !== "All") {
      query = query.ilike("incident_type", filters.crime_type);
    }
    if (filters.category && filters.category !== "All") {
      query = query.eq("category", filters.category);
    }

    const { data, error } = await query;
    if (error) throw error;

    const byYear = new Map<
      number,
      { count: number; loss: number }
    >();
    (data || []).forEach((record) => {
      const year = Number(record.year);
      if (!Number.isFinite(year)) {
        return;
      }
      const existing = byYear.get(year) || { count: 0, loss: 0 };
      byYear.set(year, {
        count: existing.count + 1,
        loss: existing.loss + (record.amount_lost_inr || 0),
      });
    });

    return Array.from(byYear.entries())
      .map(([year, data]) => ({
        Year: year,
        Cases_Reported: data.count,
        Financial_Loss: data.loss,
      }))
      .sort((a, b) => a.Year - b.Year);
  } catch (error) {
    console.error("Error fetching trends:", error);
    return [];
  }
}

export async function fetchIntelligenceDistribution(filters: {
  year?: string;
  state?: string;
  crime_type?: string;
  category?: string;
}): Promise<DistributionData[]> {
  try {
    let query = supabase.from("intelligence_reports").select("*");

    if (filters.year && filters.year !== "All") {
      query = query.eq("year", parseInt(filters.year));
    }
    if (filters.state && filters.state !== "All") {
      query = query.eq("city", filters.state);
    }
    if (filters.crime_type && filters.crime_type !== "All") {
      query = query.ilike("incident_type", filters.crime_type);
    }
    if (filters.category && filters.category !== "All") {
      query = query.eq("category", filters.category);
    }

    const { data, error } = await query;
    if (error) throw error;

    const byCrimeType = new Map<string, number>();
    (data || []).forEach((record) => {
      const type = record.incident_type || "Unknown";
      byCrimeType.set(type, (byCrimeType.get(type) || 0) + 1);
    });

    return Array.from(byCrimeType.entries()).map(([type, count]) => ({
      crime_type: type,
      count,
    }));
  } catch (error) {
    console.error("Error fetching distribution:", error);
    return [];
  }
}

export async function fetchIntelligenceCategoryDistribution(filters: {
  year?: string;
  state?: string;
  crime_type?: string;
  category?: string;
}): Promise<CategoryDistData[]> {
  try {
    let query = supabase.from("intelligence_reports").select("*");

    if (filters.year && filters.year !== "All") {
      query = query.eq("year", parseInt(filters.year));
    }
    if (filters.state && filters.state !== "All") {
      query = query.eq("city", filters.state);
    }
    if (filters.crime_type && filters.crime_type !== "All") {
      query = query.ilike("incident_type", filters.crime_type);
    }

    const { data, error } = await query;
    if (error) throw error;

    const byCategory = new Map<string, number>();
    (data || []).forEach((record) => {
      const cat = record.category || "Unknown";
      byCategory.set(cat, (byCategory.get(cat) || 0) + 1);
    });

    return Array.from(byCategory.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  } catch (error) {
    console.error("Error fetching category distribution:", error);
    return [];
  }
}

export async function fetchIntelligenceDailyDistribution(filters: {
  year?: string;
  state?: string;
  crime_type?: string;
  category?: string;
}): Promise<DailyData[]> {
  try {
    let query = supabase.from("intelligence_reports").select("*");

    if (filters.year && filters.year !== "All") {
      query = query.eq("year", parseInt(filters.year));
    }
    if (filters.state && filters.state !== "All") {
      query = query.eq("city", filters.state);
    }
    if (filters.crime_type && filters.crime_type !== "All") {
      query = query.ilike("incident_type", filters.crime_type);
    }
    if (filters.category && filters.category !== "All") {
      query = query.eq("category", filters.category);
    }

    const { data, error } = await query;
    if (error) throw error;

    const byDay = new Map<number, number>();
    (data || []).forEach((record) => {
      const day = new Date(record.day).getDate();
      if (!Number.isFinite(day)) {
        return;
      }
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });

    return Array.from(byDay.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day - b.day);
  } catch (error) {
    console.error("Error fetching daily distribution:", error);
    return [];
  }
}

export async function fetchIntelligenceGeography(filters: {
  year?: string;
  state?: string;
  crime_type?: string;
  category?: string;
}): Promise<GeographyData[]> {
  try {
    let query = supabase.from("intelligence_reports").select("*");

    if (filters.year && filters.year !== "All") {
      query = query.eq("year", parseInt(filters.year));
    }
    if (filters.state && filters.state !== "All") {
      query = query.eq("city", filters.state);
    }
    if (filters.crime_type && filters.crime_type !== "All") {
      query = query.ilike("incident_type", filters.crime_type);
    }
    if (filters.category && filters.category !== "All") {
      query = query.eq("category", filters.category);
    }

    const { data, error } = await query;
    if (error) throw error;

    const byState = new Map<string, { count: number; loss: number }>();
    (data || []).forEach((record) => {
      const state = record.city || "Unknown";
      const existing = byState.get(state) || { count: 0, loss: 0 };
      byState.set(state, {
        count: existing.count + 1,
        loss: existing.loss + (record.amount_lost_inr || 0),
      });
    });

    return Array.from(byState.entries()).map(([state, data]) => ({
      state,
      total_cases: data.count,
      total_financial_loss: data.loss,
    }));
  } catch (error) {
    console.error("Error fetching geography:", error);
    return [];
  }
}

export async function fetchIntelligenceFilters(): Promise<{
  years: number[];
  states: string[];
  crime_types: string[];
  categories: string[];
}> {
  try {
    const { data, error } = await supabase
      .from("intelligence_reports")
      .select("year, city, incident_type, category");

    if (error) throw error;

    const years = new Set<number>();
    const states = new Set<string>();
    const crimeTypes = new Set<string>();
    const categories = new Set<string>();

    (data || []).forEach((record) => {
      const year = Number(record.year);
      if (Number.isFinite(year)) {
        years.add(year);
      }
      if (record.city) states.add(record.city);
      if (record.incident_type) crimeTypes.add(record.incident_type);
      if (record.category) categories.add(record.category);
    });

    return {
      years: Array.from(years).sort((a, b) => a - b),
      states: Array.from(states).sort(),
      crime_types: Array.from(crimeTypes).sort(),
      categories: Array.from(categories).sort(),
    };
  } catch (error) {
    console.error("Error fetching filters:", error);
    return { years: [], states: [], crime_types: [], categories: [] };
  }
}

export async function fetchIntelligenceForecast(): Promise<ForecastData[]> {
  try {
    const { data, error } = await supabase
      .from("intelligence_reports")
      .select("*");

    if (error) throw error;

    // Group by year for historical data
    const byYear = new Map<
      number,
      { count: number; loss: number }
    >();
    (data || []).forEach((record) => {
      const year = Number(record.year);
      if (!Number.isFinite(year)) {
        return;
      }
      const existing = byYear.get(year) || { count: 0, loss: 0 };
      byYear.set(year, {
        count: existing.count + 1,
        loss: existing.loss + (record.amount_lost_inr || 0),
      });
    });

    const forecast: ForecastData[] = [];
    const years = Array.from(byYear.keys()).sort();

    // Add historical data
    years.forEach((year) => {
      const data = byYear.get(year)!;
      forecast.push({
        Year: year,
        Cases_Reported: data.count,
        Financial_Loss: data.loss,
        is_forecast: false,
      });
    });

    // Generate forecast for next few years
    if (years.length > 0) {
      const lastYear = Math.max(...years);
      const avgCases = forecast.reduce((sum, y) => sum + y.Cases_Reported, 0) / forecast.length;
      const avgLoss = forecast.reduce((sum, y) => sum + y.Financial_Loss, 0) / forecast.length;

      for (let i = 1; i <= 3; i++) {
        const forecastYear = lastYear + i;
        forecast.push({
          Year: forecastYear,
          Cases_Reported: Math.round(avgCases * (1 + 0.05 * i)),
          Financial_Loss: avgLoss * (1 + 0.05 * i),
          is_forecast: true,
          Cases_Predicted_Lower: Math.round(avgCases * (0.9 + 0.05 * i)),
          Cases_Predicted_Upper: Math.round(avgCases * (1.1 + 0.05 * i)),
        });
      }
    }

    return forecast;
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return [];
  }
}

export async function fetchIntelligenceRisk(): Promise<RiskData[]> {
  try {
    const { data, error } = await supabase
      .from("intelligence_reports")
      .select("city, day");

    if (error) throw error;

    // Calculate surge velocity by state
    const byState = new Map<
      string,
      { recent: number; older: number }
    >();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    (data || []).forEach((record) => {
      const state = record.city || "Unknown";
      const reportDate = new Date(record.day);
      if (Number.isNaN(reportDate.getTime())) {
        return;
      }
      const existing = byState.get(state) || { recent: 0, older: 0 };

      if (reportDate > thirtyDaysAgo) {
        existing.recent += 1;
      } else {
        existing.older += 1;
      }

      byState.set(state, existing);
    });

    return Array.from(byState.entries())
      .map(([state, data]) => ({
        State: state,
        surge_velocity:
          data.older > 0
            ? (data.recent - data.older) / data.older
            : data.recent,
        projected_cases: Math.round(data.recent * 1.2),
      }))
      .sort((a, b) => b.surge_velocity - a.surge_velocity)
      .slice(0, 5);
  } catch (error) {
    console.error("Error fetching risk data:", error);
    return [];
  }
}

// Dashboard data functions
export async function fetchRiskAreas(): Promise<RiskArea[]> {
  try {
    const { data, error } = await supabase
      .from("complaints")
      .select("state_code, priority_score")
      .eq("is_deleted", false);

    if (error) throw error;

    const grouped = new Map<string, { total: number; count: number }>();
    (data ?? []).forEach((row) => {
      const areaCode = String(row.state_code ?? "UNKNOWN");
      const existing = grouped.get(areaCode) ?? { total: 0, count: 0 };
      existing.total += Number(row.priority_score ?? 0);
      existing.count += 1;
      grouped.set(areaCode, existing);
    });

    return Array.from(grouped.entries())
      .map(([area_code, metrics]) => {
        const avg = metrics.count > 0 ? metrics.total / metrics.count : 0;
        const score = Math.round(avg * 100) / 100;
        let risk_level = "low";
        if (score >= 85) risk_level = "critical";
        else if (score >= 70) risk_level = "high";
        else if (score >= 45) risk_level = "medium";

        return { area_code, score, risk_level };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
  } catch (error) {
    console.error("Error fetching risk areas:", error);
    return [];
  }
}

export async function fetchAlerts(options?: {
  severity?: string;
  limit?: number;
}): Promise<AlertItem[]> {
  try {
    const limit = options?.limit ?? 50;
    const severityFilter = options?.severity?.toLowerCase();

    const { data, error } = await supabase
      .from("complaints")
      .select(
        "complaint_id, state_code, district_code, priority_score, freeze_status, status, submitted_at"
      )
      .neq("status", "VERDICT")
      .eq("is_deleted", false)
      .order("submitted_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const alerts = (data ?? []).map((item, index) => {
      const score = Number(item.priority_score ?? 0);
      let severity = "low";
      if (score >= 85) severity = "critical";
      else if (score >= 70) severity = "high";
      else if (score >= 45) severity = "medium";

      return {
        id: index + 1,
        alert_type: "case_signal",
        area_code: `${String(item.state_code ?? "NA")}-${String(item.district_code ?? "NA")}`,
        severity,
        message: `High-priority complaint ${String(item.complaint_id ?? "")} requires review`,
        status: String(item.freeze_status ?? "open").toLowerCase(),
        created_at: item.submitted_at ? String(item.submitted_at) : null,
      } as AlertItem;
    });

    if (!severityFilter || severityFilter === "all") {
      return alerts;
    }
    return alerts.filter((item) => item.severity === severityFilter);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }
}

export async function fetchIncidents() {
  try {
    const { data, error } = await supabase
      .from("complaints")
      .select(
        "complaint_id, raw_description, crime_category, status, submitted_at, updated_at, district_code, priority_score"
      )
      .eq("is_deleted", false)
      .order("submitted_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return (data ?? []).map((row, index) => ({
      id: index + 1,
      title: String(row.crime_category ?? "GENERAL"),
      description: String(row.raw_description ?? ""),
      crime_type: String(row.crime_category ?? "GENERAL"),
      victim_area: String(row.district_code ?? "Unknown"),
      severity_level:
        Number(row.priority_score ?? 0) >= 70
          ? "high"
          : Number(row.priority_score ?? 0) >= 45
            ? "medium"
            : "low",
      status: normalizeStatus(row.status as string | null | undefined),
      severity: "medium",
      reporter_email: null,
      location: null,
      created_at: row.submitted_at,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return [];
  }
}

export async function fetchCases(options: CaseQueryOptions = {}): Promise<CaseItem[]> {
  try {
    const statusFilter = options.status && options.status !== "all"
      ? options.status.toUpperCase()
      : undefined;
    const sortBy = options.sort_by ?? "created_at";
    const sortOrder = options.sort_order ?? "desc";
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    let query = supabase
      .from("complaints")
      .select(
        "complaint_id, raw_description, crime_category, crime_subcategory, incident_datetime, financial_loss_amount, status, priority_score, classification_confidence, organized_crime_flag, assigned_officer_id, state_code, district_code, submitted_at, updated_at"
      )
      .eq("is_deleted", false)
      .range(offset, offset + limit - 1);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    if (options.crime_type) {
      query = query.eq(
        "crime_category",
        options.crime_type.toUpperCase().replace(/\s+/g, "_")
      );
    }

    if (sortBy === "severity") {
      query = query
        .order("priority_score", { ascending: sortOrder === "asc" })
        .order("submitted_at", { ascending: false });
    } else {
      query = query.order("submitted_at", { ascending: sortOrder === "asc" });
    }

    const { data, error } = await query;
    if (error) throw error;

    const { byUuid } = await getRankedOfficers();
    return (data ?? []).map((row) => toCaseItem(row as Record<string, unknown>, byUuid));
  } catch (error) {
    console.error("Error fetching cases:", error);
    return [];
  }
}

export async function fetchAssignableOfficers(): Promise<OfficerItem[]> {
  try {
    const { ranked } = await getRankedOfficers();
    return ranked.map((row) => ({
      id: row.rank,
      full_name: row.full_name,
      email: row.email,
      role: row.role,
    }));
  } catch (error) {
    console.error("Error fetching officers:", error);
    return [];
  }
}

export async function fetchCaseGuidance(caseId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("safety_guidance_delivery")
      .select("step_code")
      .eq("complaint_id", caseId)
      .order("delivered_at", { ascending: true })
      .limit(5);

    if (error) throw error;
    if (!data || data.length === 0) return "";
    return data
      .map((row) => String(row.step_code ?? "").trim())
      .filter(Boolean)
      .join(" -> ");
  } catch (error) {
    console.error("Error fetching guidance:", error);
    return "";
  }
}

export async function updateCaseStatusInDb(
  caseId: string,
  nextStatus: string
): Promise<CaseItem> {
  const targetStatus = nextStatus.trim().toUpperCase().replace(/\s+/g, "_");
  if (!ALLOWED_CASE_STATUSES.has(targetStatus)) {
    throw new Error("Unsupported status");
  }

  const { error } = await supabase
    .from("complaints")
    .update({ status: targetStatus, updated_at: new Date().toISOString() })
    .eq("complaint_id", caseId)
    .eq("is_deleted", false);

  if (error) throw error;

  const updated = await fetchCaseById(caseId);
  if (!updated) {
    throw new Error("Case not found");
  }
  return updated;
}

export async function assignCaseToOfficer(
  caseId: string,
  assignedOfficerRank: number
): Promise<CaseItem> {
  const { ranked } = await getRankedOfficers();
  const officer = ranked.find((item) => item.rank === assignedOfficerRank);
  if (!officer) {
    throw new Error("Assigned user must be an active officer");
  }

  const { data: currentRow, error: currentError } = await supabase
    .from("complaints")
    .select("status")
    .eq("complaint_id", caseId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!currentRow) throw new Error("Case not found");

  const currentStatus = String(currentRow.status ?? "RECEIVED").toUpperCase();
  const nextStatus = ["RECEIVED", "CLASSIFIED"].includes(currentStatus)
    ? "ASSIGNED"
    : currentStatus;

  const { error } = await supabase
    .from("complaints")
    .update({
      assigned_officer_id: officer.officer_id,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("complaint_id", caseId)
    .eq("is_deleted", false);

  if (error) throw error;

  const updated = await fetchCaseById(caseId);
  if (!updated) {
    throw new Error("Case not found");
  }
  return updated;
}

export async function createCaseFromReport(
  payload: ReportCaseInput
): Promise<{ case_number: string }> {
  const { data: citizens, error: citizenError } = await supabase
    .from("citizens")
    .select("citizen_id")
    .order("created_at", { ascending: true })
    .order("citizen_id", { ascending: true })
    .limit(1);

  if (citizenError) throw citizenError;

  const victimId = citizens?.[0]?.citizen_id;
  if (!victimId) {
    throw new Error("No citizen records available");
  }

  const complaintId = crypto.randomUUID();
  const sessionSeed = crypto.randomUUID().replace(/-/g, "");
  const financialLoss = Number(payload.financial_loss ?? 0);
  const priorityScore = Math.max(
    1,
    Math.min(100, financialLoss > 0 ? Math.floor(financialLoss / 1000) + 40 : 45)
  );

  const { error } = await supabase.from("complaints").insert({
    complaint_id: complaintId,
    victim_id: victimId,
    session_id: `sess-${sessionSeed.slice(0, 12)}`,
    raw_description: String(payload.description ?? payload.title ?? "No description provided"),
    language_code: "en",
    crime_category: String(payload.crime_type ?? "GENERAL")
      .toUpperCase()
      .replace(/\s+/g, "_"),
    crime_subcategory: null,
    classification_confidence: 0.91,
    priority_score: priorityScore,
    financial_loss_amount: financialLoss,
    incident_datetime: payload.incident_date
      ? new Date(payload.incident_date).toISOString()
      : null,
    status: "RECEIVED",
    freeze_status: "NOT_APPLICABLE",
    answers_json: {},
    state_code: String(payload.state ?? "MH").toUpperCase().slice(0, 5),
    district_code: String(payload.district ?? "D001").toUpperCase().slice(0, 10),
    organized_crime_flag: false,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  return { case_number: complaintId };
}

export async function acknowledgeAlertById(alertId: number): Promise<{ id: number; status: string }> {
  return { id: alertId, status: "acknowledged" };
}

export async function uploadEvidenceForCase(input: {
  caseId: string;
  file: File;
  annotation?: string;
}): Promise<{ hash: string }> {
  const { data: caseRow, error: caseError } = await supabase
    .from("complaints")
    .select("complaint_id")
    .eq("complaint_id", input.caseId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (caseError) throw caseError;
  if (!caseRow) {
    throw new Error("Case not found");
  }

  const fileBuffer = await input.file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", fileBuffer);
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const fileType = input.file.type.startsWith("image/")
    ? "IMAGE"
    : input.file.type === "application/pdf"
      ? "PDF"
      : "DOCUMENT";

  const storagePath = `supabase://evidence/${input.caseId}/${Date.now()}-${input.file.name}`;

  const { error } = await supabase.from("evidence_files").insert({
    complaint_id: input.caseId,
    original_filename: input.file.name,
    file_type: fileType,
    mime_type: input.file.type || "application/octet-stream",
    file_size_bytes: input.file.size,
    sha256_hash: hash,
    minio_storage_path: storagePath,
    upload_timestamp: new Date().toISOString(),
    uploader_ip: "0.0.0.0",
    device_model: input.annotation ? `Note: ${input.annotation.slice(0, 150)}` : null,
    virus_scan_status: "CLEAN",
  });

  if (error) throw error;
  return { hash };
}

export async function fetchAnalyticsTrends() {
  try {
    const { data, error } = await supabase
      .from("intelligence_reports")
      .select("incident_type, amount_lost_inr");

    if (error) throw error;

    const crimeTypeMap = new Map<string, number>();
    let totalLoss = 0;

    (data || []).forEach((record) => {
      const crimeType = record.incident_type || "Unknown";
      crimeTypeMap.set(crimeType, (crimeTypeMap.get(crimeType) || 0) + 1);
      totalLoss += record.amount_lost_inr || 0;
    });

    const distribution = Array.from(crimeTypeMap.entries())
      .map(([type, count]) => ({ crime_type: type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      summary: {
        total_incidents: data?.length || 0,
        top_crime_type: distribution[0]?.crime_type || "Unknown",
        loss_amount: totalLoss,
      },
      distribution,
    };
  } catch (error) {
    console.error("Error fetching analytics trends:", error);
    return {
      summary: {
        total_incidents: 0,
        top_crime_type: "Unknown",
        loss_amount: 0,
      },
      distribution: [],
    };
  }
}

export async function fetchAnalyticsLossSummary() {
  try {
    const { data, error } = await supabase
      .from("intelligence_reports")
      .select("amount_lost_inr");

    if (error) throw error;

    const losses = (data || [])
      .map((r) => r.amount_lost_inr || 0)
      .filter((v) => v > 0)
      .sort((a, b) => b - a);

    const totalLoss = losses.reduce((sum, v) => sum + v, 0);
    const avgLoss = losses.length > 0 ? totalLoss / losses.length : 0;
    const maxLoss = losses.length > 0 ? losses[0] : 0;

    return {
      total_loss: totalLoss,
      avg_loss: avgLoss,
      max_loss: maxLoss,
    };
  } catch (error) {
    console.error("Error fetching analytics loss summary:", error);
    return {
      total_loss: 0,
      avg_loss: 0,
      max_loss: 0,
    };
  }
}
