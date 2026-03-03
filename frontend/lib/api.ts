const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

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
};

async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchRiskAreas(): Promise<RiskArea[]> {
  const data = await safeFetchJson<{ areas?: RiskArea[] }>(`${API_BASE}/risk/areas`);
  if (!data) {
    return [];
  }
  return data.areas ?? [];
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const data = await safeFetchJson<{ items?: AlertItem[] }>(`${API_BASE}/alerts`);
  if (!data) {
    return [];
  }
  return data.items ?? [];
}
