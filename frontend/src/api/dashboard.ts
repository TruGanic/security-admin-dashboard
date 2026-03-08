const BASE = import.meta.env.VITE_DASHBOARD_API_URL || "http://localhost:3100";

export type DidDocumentType = "client" | "server" | "core";

/** SLA / platform availability metrics (research component) */
export interface SlaServiceMetric {
  id: string;
  label: string;
  uptimePercent: number;
  lastChecked: string | null;
  status: "up" | "down" | "unknown";
  samples: number;
}

export interface SlaMetricsResponse {
  services: SlaServiceMetric[];
  platformUptimePercent: number;
  timestamp: string;
  windowMinutes: number;
}

export async function fetchSlaMetrics(): Promise<SlaMetricsResponse | null> {
  try {
    const res = await fetch(`${BASE}/api/sla/metrics`);
    const data = (await res.json()) as SlaMetricsResponse & { error?: string };
    if (!res.ok) return null;
    return data;
  } catch {
    return null;
  }
}

/** Request audit entry (Gateway: who requested what, granted/denied) */
export interface AuditEntry {
  did: string | null;
  method: string;
  path: string;
  granted: boolean;
  reason?: string;
  timestamp: string;
}

export interface AuditRecentResponse {
  entries: AuditEntry[];
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  timestamp: string;
  hint?: string;
}

export async function fetchAuditRecent(
  limit = 10,
  page = 1
): Promise<AuditRecentResponse | null> {
  try {
    const params = new URLSearchParams({ limit: String(limit), page: String(page) });
    const res = await fetch(`${BASE}/api/audit/recent?${params.toString()}`);
    const data = (await res.json()) as AuditRecentResponse & { error?: string };
    if (!res.ok) return null;
    return data;
  } catch {
    return null;
  }
}

/** Aggregated audit stats for dashboard overview */
export interface AuditStats {
  totalRequests: number;
  get: number;
  post: number;
  put: number;
  patch: number;
  delete: number;
  other: number;
  granted: number;
  denied: number;
  timestamp: string;
}

export async function fetchAuditStats(): Promise<AuditStats | null> {
  try {
    const res = await fetch(`${BASE}/api/audit/stats`);
    const data = (await res.json()) as AuditStats & { error?: string };
    if (!res.ok) return null;
    return data;
  } catch {
    return null;
  }
}

/** Fetch IDs from did-documents repo for the given type (clients/, servers/, or core). */
export async function fetchDidIds(type: DidDocumentType): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/api/did/ids?type=${type}`);
    const data = (await res.json()) as { ids?: string[] };
    return Array.isArray(data.ids) ? data.ids : [];
  } catch {
    return [];
  }
}

export async function publishDid(
  didDocument: Record<string, unknown>,
  type: DidDocumentType,
  id: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const res = await fetch(`${BASE}/api/publish-did`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ didDocument, type, id }),
  });
  return res.json();
}
