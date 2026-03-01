import { useState } from "react";
import { publishDid } from "../api/dashboard";
import type { KeyPairResult } from "../utils/keys";
import "../styles/layout.css";

interface PublishDidProps {
  keyResult: KeyPairResult | null;
}

export function PublishDid({ keyResult }: PublishDidProps) {
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePublish = async () => {
    if (!keyResult) {
      setMessage({ type: "error", text: "Generate a key pair first (Key & DID)." });
      return;
    }
    setPublishing(true);
    setMessage(null);
    try {
      const r = await publishDid(keyResult.didDocument, keyResult.type, keyResult.id);
      if (r.success) {
        setMessage({ type: "success", text: r.url ? `Published. ${r.url}` : "Published to GitHub." });
      } else {
        setMessage({ type: "error", text: r.error || "Publish failed." });
      }
    } catch (e: unknown) {
      setMessage({ type: "error", text: (e as Error).message || "Request failed." });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Publish DID to GitHub</h2>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        Uses the DID document from the last key generation. Publishes to the <strong>did-documents</strong> repo (clients/, servers/, or core/).
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handlePublish}
        disabled={publishing || !keyResult}
      >
        {publishing ? "Publishing…" : "Publish DID to GitHub"}
      </button>
      {message && (
        <p className={message.type === "success" ? "status-success" : "status-error"} style={{ marginTop: "0.75rem" }}>
          {message.text}
        </p>
      )}
    </div>
  );
}
