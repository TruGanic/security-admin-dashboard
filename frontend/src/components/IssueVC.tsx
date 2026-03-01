import { useState } from "react";
import { issueVC } from "../api/security";
import "../styles/layout.css";

const PRESET_PERMISSIONS = ["read:farmer", "write:farmer", "read:data", "write:data"];

export function IssueVC() {
  const [did, setDid] = useState("did:web:truganic.github.io:did-documents:clients:farmer-client");
  const [pluginId, setPluginId] = useState("farmer-client");
  const [permissions, setPermissions] = useState<string[]>(["read:farmer", "write:farmer"]);
  const [version, setVersion] = useState("1.0.0");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; vcId?: string } | null>(null);

  const togglePerm = (p: string) => {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (permissions.length === 0) {
      setMessage({ type: "error", text: "Select at least one permission." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const r = await issueVC({ pluginId, did, permissions, version });
      if (r.success) {
        const vcId = (r.vc as { proof?: { verificationMethod?: string } })?.proof?.verificationMethod;
        setMessage({
          type: "success",
          text: "VC issued successfully.",
          vcId: vcId || undefined,
        });
      } else {
        setMessage({ type: "error", text: r.message || "Failed to issue VC." });
      }
    } catch (e: unknown) {
      setMessage({ type: "error", text: (e as Error).message || "Request failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Issue VC</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>DID</label>
          <input type="text" value={did} onChange={(e) => setDid(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Plugin ID</label>
          <input type="text" value={pluginId} onChange={(e) => setPluginId(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Permissions</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {PRESET_PERMISSIONS.map((p) => (
              <label key={p} style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={permissions.includes(p)}
                  onChange={() => togglePerm(p)}
                />
                <span>{p}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="input-group">
          <label>Version (optional)</label>
          <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Issuing…" : "Issue VC"}
        </button>
      </form>
      {message && (
        <div style={{ marginTop: "0.75rem" }}>
          <span className={message.type === "success" ? "pill pill-success" : "pill pill-error"}>
            {message.text}
          </span>
          {message.vcId && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              VC ID (for revoke): {message.vcId}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
