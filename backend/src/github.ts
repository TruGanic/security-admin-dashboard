/**
 * Publish DID document to GitHub using REST API (create or update file).
 * Uses only the did-documents repo; differentiates clients, servers, and core.
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "truganic/did-documents";
const BASE_PATH = process.env.BASE_PATH ?? "";

export type DidDocumentType = "client" | "server" | "core";

function contentsPath(type: DidDocumentType): string {
  const segment = type === "client" ? "clients" : type === "server" ? "servers" : "core";
  return BASE_PATH ? `${BASE_PATH}/${segment}` : segment;
}

/**
 * List DID IDs from the did-documents repo for a given type.
 * - client: folder names under clients/
 * - server: folder names under servers/
 * - core: ["core"] (single did.json at core/did.json)
 */
export async function listDidIds(
  type: DidDocumentType
): Promise<{ success: boolean; ids?: string[]; error?: string }> {
  if (!GITHUB_TOKEN) {
    return { success: false, error: "GITHUB_TOKEN is not set" };
  }
  if (type === "core") {
    return { success: true, ids: ["core"] };
  }
  const path = contentsPath(type);
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  try {
    const res = await fetch(apiUrl, { headers });
    if (!res.ok) {
      if (res.status === 404) return { success: true, ids: [] };
      const err = (await res.json()) as { message?: string };
      return { success: false, error: err.message || `GitHub API: ${res.status}` };
    }
    const data = (await res.json()) as Array<{ type: string; name: string }>;
    const ids = (Array.isArray(data) ? data : [])
      .filter((item) => item.type === "dir")
      .map((item) => item.name)
      .sort();
    return { success: true, ids };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message || "Failed to list IDs" };
  }
}

export async function publishDid(
  didDocument: Record<string, unknown>,
  type: DidDocumentType,
  id: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!GITHUB_TOKEN) {
    return { success: false, error: "GITHUB_TOKEN is not set" };
  }
  const path =
    type === "core"
      ? (BASE_PATH ? `${BASE_PATH}/core/did.json` : "core/did.json")
      : (BASE_PATH ? `${BASE_PATH}/${type === "client" ? "clients" : "servers"}/${id}/did.json` : `${type === "client" ? "clients" : "servers"}/${id}/did.json`);
  const content = JSON.stringify(didDocument, null, 2);
  const base64Content = Buffer.from(content, "utf-8").toString("base64");

  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  let sha: string | undefined;
  try {
    const getRes = await fetch(apiUrl, { headers });
    if (getRes.ok) {
      const data = (await getRes.json()) as { sha?: string };
      sha = data.sha;
    }
  } catch {
    // File may not exist; we'll create it
  }

  const body: { message: string; content: string; sha?: string } = {
    message: `Update DID document for ${type}/${id}`,
    content: base64Content,
  };
  if (sha) body.sha = sha;

  const res = await fetch(apiUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    return {
      success: false,
      error: err.message || `GitHub API error: ${res.status}`,
    };
  }

  const data = (await res.json()) as { content?: { html_url?: string } };
  return {
    success: true,
    url: data.content?.html_url,
  };
}
