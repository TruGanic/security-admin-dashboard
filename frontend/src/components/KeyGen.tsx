import { useState, useEffect } from "react";
import { generateKeyPair, toEnvSnippet, type KeyPairResult, type DidDocumentType } from "../utils/keys";
import { fetchDidIds } from "../api/dashboard";
import "../styles/layout.css";

interface KeyGenProps {
  onGenerated?: (result: KeyPairResult) => void;
}

const NEW_ID_VALUE = "__new__";
const TYPE_LABELS: Record<DidDocumentType, string> = {
  client: "Client",
  server: "Server",
  core: "Core",
};

export function KeyGen({ onGenerated }: KeyGenProps) {
  const [docType, setDocType] = useState<DidDocumentType>("client");
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>(NEW_ID_VALUE);
  const [newId, setNewId] = useState("farmer-client");
  const [result, setResult] = useState<KeyPairResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchDidIds(docType).then((ids) => {
      setExistingIds(ids);
      if (ids.length > 0) setSelectedId(ids[0]);
      else setSelectedId(NEW_ID_VALUE);
    });
  }, [docType]);

  const effectiveId = docType === "core" ? "core" : selectedId === NEW_ID_VALUE ? newId.trim() : selectedId;
  const idForGenerate = effectiveId || (docType === "server" ? "farmer-server" : "farmer-client");

  const handleGenerate = () => {
    const keyResult = generateKeyPair(docType, idForGenerate);
    setResult(keyResult);
    onGenerated?.(keyResult);
  };

  const envSnippet = result ? toEnvSnippet(result.did, result.privateKeyHex) : "";

  const copyEnv = () => {
    if (!envSnippet) return;
    navigator.clipboard.writeText(envSnippet);
    setCopied("env");
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadEnv = () => {
    if (!envSnippet) return;
    const blob = new Blob([envSnippet], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = ".env.snippet";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="card">
      <h2 className="card-title">Generate key pair</h2>
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        Uses the <strong>did-documents</strong> repo. Choose type (Client / Server / Core) then pick an existing ID or add new.
      </p>
      <div className="input-group">
        <label>Type (did-documents)</label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as DidDocumentType)}
          className="input-select"
        >
          <option value="client">Client</option>
          <option value="server">Server</option>
          <option value="core">Core</option>
        </select>
      </div>
      {docType !== "core" && (
        <div className="input-group">
          <label>{TYPE_LABELS[docType]} ID (from repo or add new)</label>
          {existingIds.length > 0 ? (
            <>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="input-select"
              >
                {existingIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
                <option value={NEW_ID_VALUE}>— New {docType} (type below) —</option>
              </select>
              {selectedId === NEW_ID_VALUE && (
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder={docType === "client" ? "e.g. farmer-client" : "e.g. farmer-server"}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                {existingIds.length} {docType}(s) from did-documents repo.
              </span>
            </>
          ) : (
            <input
              type="text"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder={docType === "client" ? "farmer-client" : "farmer-server"}
            />
          )}
        </div>
      )}
      {docType === "core" && (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Single DID: did:web:truganic.github.io:did-documents:core
        </span>
      )}
      <button type="button" className="btn btn-primary" onClick={handleGenerate} style={{ marginTop: "0.75rem" }}>
        Generate key pair
      </button>
      {result && (
        <div style={{ marginTop: "1.25rem" }}>
          <div className="input-group">
            <label>DID</label>
            <input type="text" value={result.did} readOnly style={{ fontFamily: "monospace", fontSize: "0.85rem" }} />
          </div>
          <div className="input-group">
            <label>Private key (hex) – keep secret</label>
            <input
              type="password"
              value={result.privateKeyHex}
              readOnly
              style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button type="button" className="btn btn-primary" onClick={copyEnv}>
              {copied === "env" ? "Copied" : "Copy .env snippet"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={downloadEnv}>
              Download .env snippet
            </button>
          </div>
          <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Paste into the app .env. Format: CLIENT_DID=... and CLIENT_PRIVATE_KEY=...
          </p>
        </div>
      )}
    </div>
  );
}
