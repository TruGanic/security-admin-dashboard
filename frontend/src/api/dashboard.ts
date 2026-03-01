const BASE = import.meta.env.VITE_DASHBOARD_API_URL || "http://localhost:3100";

export type DidDocumentType = "client" | "server" | "core";

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
