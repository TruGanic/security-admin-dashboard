const BASE = import.meta.env.VITE_SECURITY_SERVICE_URL || "http://localhost:3001";

export interface IssueVCRequest {
  pluginId: string;
  did: string;
  permissions: string[];
  version?: string;
  expirationDate?: string;
}

export async function issueVC(body: IssueVCRequest): Promise<{ success: boolean; vc?: unknown; message?: string }> {
  const res = await fetch(`${BASE}/api/vc/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return { success: false, message: data.message || data.error || "Failed to issue VC" };
  return data;
}

export async function revokeVC(vcId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/vc/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vcId, reason }),
  });
  const data = await res.json();
  if (!res.ok) return { success: false, error: data.error || "Failed to revoke VC" };
  return data;
}
