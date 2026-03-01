import { useState } from "react";
import { revokeVC } from "../api/security";
import "../styles/layout.css";

export function RevokeVC() {
  const [vcId, setVcId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vcId.trim()) {
      setMessage({ type: "error", text: "Enter VC ID." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const r = await revokeVC(vcId.trim(), reason.trim() || undefined);
      if (r.success) {
        setMessage({ type: "success", text: "VC revoked successfully." });
        setVcId("");
        setReason("");
      } else {
        setMessage({ type: "error", text: r.error || "Revoke failed." });
      }
    } catch (e: unknown) {
      setMessage({ type: "error", text: (e as Error).message || "Request failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Revoke VC</h2>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        Paste the VC ID (from Issue VC response or Security service).
      </p>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>VC ID</label>
          <input
            type="text"
            value={vcId}
            onChange={(e) => setVcId(e.target.value)}
            placeholder="UUID or JWS string"
          />
        </div>
        <div className="input-group">
          <label>Reason (optional)</label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Revoked by administrator" />
        </div>
        <button type="submit" className="btn btn-danger" disabled={loading}>
          {loading ? "Revoking…" : "Revoke VC"}
        </button>
      </form>
      {message && (
        <p className={message.type === "success" ? "status-success" : "status-error"} style={{ marginTop: "0.75rem" }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
