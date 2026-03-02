import { useState, useEffect } from "react";
import { KeyRound, FileText, Upload, Eye, EyeOff, Copy, Download } from "lucide-react";
import {
  generateKeysOnly,
  buildDidDocumentFromKeys,
  toEnvSnippet,
  toEnvSnippetMasked,
  type KeyPairOnly,
  type DidDocumentType,
} from "../utils/keys";
import { fetchDidIds, publishDid } from "../api/dashboard";
import { Dropdown, type DropdownOption } from "./Dropdown";
import "../styles/layout.css";

const NEW_ID_VALUE = "__new__";
const TYPE_LABELS: Record<DidDocumentType, string> = {
  client: "Client",
  server: "Server",
  core: "Core",
};

export function KeyGen() {
  // Card 1: Key pair only
  const [keys, setKeys] = useState<KeyPairOnly | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // Card 2: DID document
  const [docType, setDocType] = useState<DidDocumentType>("client");
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>(NEW_ID_VALUE);
  const [newId, setNewId] = useState("farmer-client");
  const [didResult, setDidResult] = useState<{
    did: string;
    didDocument: Record<string, unknown>;
    type: DidDocumentType;
    id: string;
  } | null>(null);

  // Card 3: Publish
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // .env copy feedback
  const [envCopied, setEnvCopied] = useState(false);

  useEffect(() => {
    fetchDidIds(docType).then((ids) => {
      setExistingIds(ids);
      if (ids.length > 0) setSelectedId(ids[0]);
      else setSelectedId(NEW_ID_VALUE);
    });
  }, [docType]);

  const effectiveId = docType === "core" ? "core" : selectedId === NEW_ID_VALUE ? newId.trim() : selectedId;
  const idForDid = effectiveId || (docType === "server" ? "farmer-server" : "farmer-client");

  // Card 1: Generate keys only — resets downstream state so DID doc and .env disappear
  const handleGenerateKeys = () => {
    setKeys(generateKeysOnly());
    setDidResult(null);
    setPublishUrl(null);
    setPublishError(null);
    setShowPrivateKey(false);
    setEnvCopied(false);
  };

  // Card 2: Generate DID document from keys
  const handleGenerateDid = () => {
    if (!keys) return;
    const { did, didDocument } = buildDidDocumentFromKeys(
      keys.publicKeyX,
      keys.publicKeyY,
      docType,
      idForDid
    );
    setDidResult({ did, didDocument, type: docType, id: idForDid });
    setPublishUrl(null);
    setPublishError(null);
  };

  // Card 3: Publish
  const handlePublish = async () => {
    if (!didResult) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const r = await publishDid(didResult.didDocument, didResult.type, didResult.id);
      if (r.success && r.url) {
        setPublishUrl(r.url);
        // Refetch IDs from GitHub so the new client/server appears in the dropdown
        const ids = await fetchDidIds(docType);
        setExistingIds(ids);
        if (docType !== "core" && ids.includes(didResult.id)) setSelectedId(didResult.id);
      } else {
        setPublishError(r.error || "Publish failed.");
      }
    } catch (e: unknown) {
      setPublishError((e as Error).message || "Request failed.");
    } finally {
      setPublishing(false);
    }
  };

  const publicKeyDisplay = keys
    ? `${keys.publicKeyX}${keys.publicKeyY}`.length > 80
      ? `${keys.publicKeyX}\n${keys.publicKeyY}`
      : `${keys.publicKeyX}${keys.publicKeyY}`
    : "";
  const privateKeyDisplay = keys
    ? showPrivateKey
      ? keys.privateKeyHex
      : "•".repeat(64)
    : "";

  return (
    <div className="key-did-flow">
      {/* Card 1: Key pair generation */}
      <div className="card">
        <div className="card-header-row">
          <span className="card-step-icon green" aria-hidden><KeyRound size={22} strokeWidth={2} /></span>
          <div className="card-header-content">
            <h2 className="card-title">Key pair generation</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
              Generate a secp256k1 key pair. The private key is shown masked; use it only in your app .env.
            </p>
          </div>
          <div className="card-header-actions">
            <button type="button" className="btn btn-primary" onClick={handleGenerateKeys}>
              Generate keys
            </button>
          </div>
        </div>
        {keys && (
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>
                Public key
              </label>
              <div className="key-display">{publicKeyDisplay}</div>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>
                Private key (keep secret)
              </label>
              <div className="key-display-wrap">
                <div className="key-display" style={{ letterSpacing: "0.05em" }}>
                  {privateKeyDisplay}
                </div>
                <button
                  type="button"
                  className="key-visibility-toggle"
                  onClick={() => setShowPrivateKey((v) => !v)}
                  aria-label={showPrivateKey ? "Hide private key" : "Show private key"}
                  title={showPrivateKey ? "Hide private key" : "Show private key"}
                >
                  {showPrivateKey ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card 2: DID Document generation */}
      <div className="card">
        <div className="card-header-row">
          <span className="card-step-icon green" aria-hidden><FileText size={22} strokeWidth={2} /></span>
          <div className="card-header-content">
            <h2 className="card-title">DID Document generation</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
              Build the DID document from your keys. Choose type and ID (did-documents repo).
            </p>
          </div>
          <div className="card-header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerateDid}
              disabled={!keys}
            >
              Generate DID
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          <div className="input-group" style={{ flex: "1 1 140px", minWidth: 0 }}>
            <Dropdown
              label="Type"
              options={[
                { value: "client", label: "Client" },
                { value: "server", label: "Server" },
                { value: "core", label: "Core" },
              ]}
              value={docType}
              onChange={(v) => setDocType(v as DidDocumentType)}
            />
          </div>
          {docType !== "core" && (
            <div className="input-group" style={{ flex: "1 1 200px", minWidth: 0 }}>
              {existingIds.length > 0 ? (
                <>
                  <Dropdown
                    label={`${TYPE_LABELS[docType]} ID`}
                    options={[
                      ...existingIds.map((id): DropdownOption => ({ value: id, label: id })),
                      { value: NEW_ID_VALUE, label: "— New (type below) —" },
                    ]}
                    value={selectedId}
                    onChange={setSelectedId}
                  />
                  {selectedId === NEW_ID_VALUE && (
                    <input
                      type="text"
                      value={newId}
                      onChange={(e) => setNewId(e.target.value)}
                      placeholder={docType === "client" ? "e.g. farmer-client" : "e.g. farmer-server"}
                      style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.9rem", width: "100%" }}
                    />
                  )}
                </>
              ) : (
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder={docType === "client" ? "farmer-client" : "farmer-server"}
                  style={{ padding: "0.5rem 0.75rem", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.9rem", width: "100%" }}
                />
              )}
            </div>
          )}
        </div>
        {didResult && (
          <div className="did-json-card">
            <div className="did-json-title">DID Document</div>
            <pre className="did-json-display">
              <button
                type="button"
                className="did-json-copy-btn"
                onClick={() =>
                  navigator.clipboard.writeText(
                    JSON.stringify(didResult.didDocument, null, 2)
                  )
                }
                aria-label="Copy DID document JSON"
                title="Copy DID document JSON"
              >
                <Copy size={16} strokeWidth={2} aria-hidden />
              </button>
              {JSON.stringify(didResult.didDocument, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Card 3: DID publication */}
      <div className="card">
        <div className="card-header-row">
          <span className="card-step-icon green" aria-hidden><Upload size={22} strokeWidth={2} /></span>
          <div className="card-header-content">
            <h2 className="card-title">DID publication</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
              Publish the DID document to the did-documents repo on GitHub. Then open the link to verify.
            </p>
          </div>
          <div className="card-header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePublish}
              disabled={!didResult || publishing}
            >
              {publishing ? "Publishing…" : "Publish to GitHub"}
            </button>
          </div>
        </div>
        {publishError && (
          <p className="status-error" style={{ marginTop: "0.75rem" }}>{publishError}</p>
        )}
        {publishUrl && (
          <div style={{ marginTop: "0.5rem" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.35rem" }}>
              Published (Ctrl+click or click to open)
            </label>
            <a
              href={publishUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="published-link"
            >
              {publishUrl}
            </a>
          </div>
        )}
      </div>

      {/* Optional: .env snippet when we have keys + DID */}
      {didResult && keys && (
        <div className="card">
          <h2 className="card-title">.env snippet</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            Paste into your app .env (e.g. client-farmer). Private key is hidden; copy or download to get the real values.
          </p>
          <pre className="key-display env-snippet-display" style={{ marginBottom: "0.75rem" }}>
            {toEnvSnippetMasked(didResult.did, didResult.type)}
          </pre>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                navigator.clipboard.writeText(toEnvSnippet(didResult.did, keys.privateKeyHex, didResult.type));
                setEnvCopied(true);
                setTimeout(() => setEnvCopied(false), 2000);
              }}
            >
              {envCopied ? "Copied to clipboard" : "Copy to clipboard"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const content = toEnvSnippet(didResult.did, keys.privateKeyHex, didResult.type);
                const blob = new Blob([content], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = ".env";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download size={16} strokeWidth={2} style={{ marginRight: "0.35rem", verticalAlign: "middle" }} />
              Download .env
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
