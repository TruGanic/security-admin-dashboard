import { useState, useEffect } from "react";
import { fetchDidIds, type DidDocumentType } from "../api/dashboard";
import { fetchCurrentVCByDid, revokeVC, type CurrentVCResponse } from "../api/security";
import { type RecipientType } from "../config/permissions";
import { Dropdown, type DropdownOption } from "./Dropdown";
import "../styles/layout.css";

const DID_BASE = "did:web:truganic.github.io:did-documents";

const RECIPIENT_TYPE_OPTIONS: DropdownOption[] = [
  { value: "client", label: "Client" },
  { value: "server", label: "Server" },
];

export function RevokeVC() {
  const [recipientType, setRecipientType] = useState<RecipientType>("client");
  const [idOptions, setIdOptions] = useState<DropdownOption[]>([]);
  const [idsLoading, setIdsLoading] = useState(false);
  const [idsError, setIdsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");

  const [did, setDid] = useState("");
  const [vcResult, setVcResult] = useState<CurrentVCResponse | null>(null);
  const [vcLoading, setVcLoading] = useState(false);
  const [vcError, setVcError] = useState<string | null>(null);

  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeMessage, setRevokeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [reason, setReason] = useState("");

  // Load IDs from did-documents (via dashboard backend) when type changes
  useEffect(() => {
    let cancelled = false;

    const loadIds = async () => {
      setIdsLoading(true);
      setIdsError(null);
      setIdOptions([]);
      setSelectedId("");
      setDid("");
      setVcResult(null);
      setVcError(null);
      try {
        const typeForApi: DidDocumentType =
          recipientType === "client" ? "client" : "server";
        const ids = await fetchDidIds(typeForApi);
        if (cancelled) return;
        setIdOptions(ids.map((id) => ({ value: id, label: id })));
      } catch (e) {
        if (cancelled) return;
        setIdsError(
          (e as Error)?.message || "Failed to load IDs from did-documents."
        );
      } finally {
        if (!cancelled) {
          setIdsLoading(false);
        }
      }
    };

    void loadIds();

    return () => {
      cancelled = true;
    };
  }, [recipientType]);

  const handleRecipientTypeChange = (value: string) => {
    const type = (value as RecipientType) || "client";
    setRecipientType(type);
    setRevokeMessage(null);
  };

  const handleIdChange = (value: string) => {
    setSelectedId(value);
    const segment = recipientType === "client" ? "clients" : "servers";
    const resolvedDid = `${DID_BASE}:${segment}:${value}`;
    setDid(resolvedDid);
    setVcResult(null);
    setVcError(null);
    setRevokeMessage(null);

    if (!resolvedDid) return;

    setVcLoading(true);
    void fetchCurrentVCByDid(resolvedDid)
      .then((result) => {
        if (!result.success) {
          setVcResult(null);
          setVcError(result.message || "No active VC found for this DID.");
          return;
        }
        setVcResult(result);
      })
      .catch(() => {
        setVcResult(null);
        setVcError("Failed to fetch VC for this DID.");
      })
      .finally(() => {
        setVcLoading(false);
      });
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vcResult || (!vcResult.vcId && !vcResult.jws)) {
      setRevokeMessage({
        type: "error",
        text: "No VC loaded to revoke.",
      });
      return;
    }
    const vcIdForRevoke = vcResult.vcId || vcResult.jws!;
    setRevokeLoading(true);
    setRevokeMessage(null);
    try {
      const r = await revokeVC(vcIdForRevoke, reason.trim() || undefined);
      if (r.success) {
        setRevokeMessage({ type: "success", text: "VC revoked successfully." });
        setVcResult(null);
        setReason("");
      } else {
        setRevokeMessage({ type: "error", text: r.error || "Revoke failed." });
      }
    } catch (err: unknown) {
      setRevokeMessage({
        type: "error",
        text: (err as Error).message || "Request failed.",
      });
    } finally {
      setRevokeLoading(false);
    }
  };

  const idPlaceholder =
    idsLoading && idOptions.length === 0
      ? "Loading IDs…"
      : idOptions.length === 0
      ? "No IDs found for this type"
      : "Select ID…";

  const permissions =
    (vcResult?.permissions && Array.isArray(vcResult.permissions)
      ? vcResult.permissions
      : []) || [];

  const vcSummary = vcResult?.vc as any;

  return (
    <div className="card">
      <h2 className="card-title">Revoke VC</h2>
      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--text-muted)",
          marginBottom: "1rem",
        }}
      >
        Select a client or server, load its current VC (if any), then revoke it.
      </p>
      <form onSubmit={handleRevoke}>
        <div className="form-row">
          <div className="input-group">
            <Dropdown
              label="Recipient type"
              options={RECIPIENT_TYPE_OPTIONS}
              value={recipientType}
              onChange={handleRecipientTypeChange}
              aria-label="Select recipient type"
            />
          </div>
          <div className="input-group">
            <Dropdown
              label={
                recipientType === "client"
                  ? "Client ID (from did-documents)"
                  : "Server ID (from did-documents)"
              }
              options={idOptions}
              value={selectedId}
              onChange={handleIdChange}
              placeholder={idPlaceholder}
              aria-label="Select DID ID"
              disabled={idsLoading && idOptions.length === 0}
            />
            {idsError && (
              <p
                style={{
                  marginTop: "0.4rem",
                  fontSize: "0.8rem",
                  color: "var(--danger)",
                }}
              >
                {idsError}
              </p>
            )}
          </div>
        </div>
        <div className="input-group">
          <label>DID (auto-resolved)</label>
          <input
            type="text"
            value={did}
            readOnly
            placeholder="Select type and ID to resolve DID"
          />
        </div>

        {vcLoading && (
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              marginBottom: "0.75rem",
            }}
          >
            Loading current VC…
          </p>
        )}

        {vcError && !vcLoading && (
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--danger)",
              marginBottom: "0.75rem",
            }}
          >
            {vcError}
          </p>
        )}

        {vcResult && !vcLoading && (
          <div className="card" style={{ marginTop: "0.75rem" }}>
            <h3 className="card-title" style={{ marginBottom: "0.5rem" }}>
              Current VC for this DID
            </h3>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ marginBottom: "0.35rem" }}>
                <strong>VC ID:</strong>{" "}
                <code style={{ fontSize: "0.8em" }}>
                  {vcResult.vcId || vcResult.jws || "N/A"}
                </code>
              </div>
              {vcSummary?.credentialSubject?.version && (
                <div style={{ marginBottom: "0.35rem" }}>
                  <strong>Version:</strong>{" "}
                  <code style={{ fontSize: "0.8em" }}>
                    {vcSummary.credentialSubject.version}
                  </code>
                </div>
              )}
              {vcSummary?.expirationDate && (
                <div style={{ marginBottom: "0.35rem" }}>
                  <strong>Expires:</strong>{" "}
                  <code style={{ fontSize: "0.8em" }}>
                    {vcSummary.expirationDate}
                  </code>
                </div>
              )}
              {permissions.length > 0 && (
                <div style={{ marginTop: "0.35rem" }}>
                  <strong>Permissions:</strong>
                  <div className="permissions-reference-list" style={{ marginTop: "0.25rem" }}>
                    {permissions.map((p) => (
                      <span
                        key={p}
                        className="permissions-reference-tag"
                        style={{ fontSize: "0.8rem" }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Revoked by administrator"
              />
            </div>

            <button
              type="submit"
              className="btn btn-danger"
              disabled={revokeLoading}
            >
              {revokeLoading ? "Revoking…" : "Revoke this VC"}
            </button>
          </div>
        )}
      </form>

      {revokeMessage && (
        <p
          className={
            revokeMessage.type === "success"
              ? "status-success"
              : "status-error"
          }
          style={{ marginTop: "0.75rem" }}
        >
          {revokeMessage.text}
        </p>
      )}
    </div>
  );
}
