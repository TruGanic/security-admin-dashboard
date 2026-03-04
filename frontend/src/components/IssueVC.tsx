import { useState, useMemo, useEffect, useRef } from "react";
import { issueVC, fetchCurrentVCByDid } from "../api/security";
import { fetchDidIds, type DidDocumentType } from "../api/dashboard";
import { type RecipientType } from "../config/permissions";
import { Dropdown, type DropdownOption } from "./Dropdown";
import "../styles/layout.css";

const DID_BASE = "did:web:truganic.github.io:did-documents";
const PERM_ACTIONS = ["read", "write", "delete"] as const;
type PermAction = (typeof PERM_ACTIONS)[number];

interface PermissionOption {
  value: string;
  label: string;
  description?: string;
}

const RECIPIENT_TYPE_OPTIONS: DropdownOption[] = [
  { value: "client", label: "Client" },
  { value: "server", label: "Server" },
];

export function IssueVC() {
  const [recipientType, setRecipientType] = useState<RecipientType>("client");
  const [idOptions, setIdOptions] = useState<DropdownOption[]>([]);
  const [idsLoading, setIdsLoading] = useState(false);
  const [idsError, setIdsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");

  const [did, setDid] = useState("");
  const [serverIds, setServerIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [version, setVersion] = useState("1.0.0");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
    vcId?: string;
  } | null>(null);

  const [vcLoading, setVcLoading] = useState(false);
  const [vcInfo, setVcInfo] = useState<string | null>(null);
  const filledSectionRef = useRef<HTMLDivElement>(null);
  const didScrollAfterLoadRef = useRef(false);

  // Load list of servers (used as permission resources)
  useEffect(() => {
    let cancelled = false;
    const loadServers = async () => {
      try {
        const ids = await fetchDidIds("server");
        if (cancelled) return;
        setServerIds(ids);
      } catch {
        if (cancelled) return;
        setServerIds([]);
      }
    };
    void loadServers();
    return () => {
      cancelled = true;
    };
  }, []);

  const permissionOptions: PermissionOption[] = useMemo(() => {
    if (!serverIds || serverIds.length === 0) return [];

    const targets =
      recipientType === "client"
        ? serverIds
        : serverIds.filter((id) => id !== selectedId);

    const verbLabel = (action: PermAction) => {
      switch (action) {
        case "read":
          return "READ";
        case "write":
          return "WRITE";
        case "delete":
          return "DELETE";
        default:
          return action.toUpperCase();
      }
    };

    const perServerOptions = targets.flatMap<PermissionOption>((serverId) =>
      PERM_ACTIONS.map((action) => ({
        value: `${action}:${serverId}`,
        label: `${verbLabel(action)} ${serverId}`,
        description:
          action === "read"
            ? `Allow ${recipientType} to GET from ${serverId}`
            : action === "write"
            ? `Allow ${recipientType} to POST/PUT/PATCH to ${serverId}`
            : `Allow ${recipientType} to DELETE on ${serverId}`,
      }))
    );

    const wildcardOptions: PermissionOption[] = PERM_ACTIONS.map((action) => ({
      value: `${action}:*`,
      label: `${verbLabel(action)} ALL`,
      description:
        action === "read"
          ? `Allow ${recipientType} to read from all servers`
          : action === "write"
          ? `Allow ${recipientType} to write to all servers`
          : `Allow ${recipientType} to delete on all servers`,
    }));

    return [...perServerOptions, ...wildcardOptions];
  }, [recipientType, serverIds, selectedId]);

  // Load IDs from did-documents (via dashboard backend) when type changes
  useEffect(() => {
    let cancelled = false;

    const loadIds = async () => {
      setIdsLoading(true);
      setIdsError(null);
      setIdOptions([]);
      setSelectedId("");
      setDid("");
      setPermissions([]);
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

  const togglePerm = (p: string) => {
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleRecipientTypeChange = (value: string) => {
    const type = (value as RecipientType) || "client";
    setRecipientType(type);
    setMessage(null);
  };

  const handleIdChange = (value: string) => {
    setSelectedId(value);
    const segment = recipientType === "client" ? "clients" : "servers";
    const resolvedDid = `${DID_BASE}:${segment}:${value}`;
    setDid(resolvedDid);
    setVcInfo(null);
    didScrollAfterLoadRef.current = false;

    if (!resolvedDid) return;

    // Fetch current VC for this DID to prefill permissions if it exists
    setVcLoading(true);
    setPermissions([]);
    void fetchCurrentVCByDid(resolvedDid)
      .then((result) => {
        if (!result.success || !Array.isArray(result.permissions)) {
          setVcInfo("No existing VC found for this DID. You can issue a new one.");
          return;
        }
        setPermissions(result.permissions);
        const existingVersion =
          (result.vc as any)?.credentialSubject?.version ||
          (result.vc as any)?.version;
        if (typeof existingVersion === "string" && existingVersion.length > 0) {
          setVersion(existingVersion);
        }
        setVcInfo("Loaded current VC permissions for this DID.");
        didScrollAfterLoadRef.current = false;
      })
      .catch(() => {
        setVcInfo("Could not load current VC. You can still issue a new one.");
      })
      .finally(() => {
        setVcLoading(false);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !did) {
      setMessage({
        type: "error",
        text: "Select a type and ID so the DID can be resolved.",
      });
      return;
    }
    if (permissions.length === 0) {
      setMessage({ type: "error", text: "Select at least one permission." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // Use the selected ID as plugin identifier in the security core
      const r = await issueVC({ pluginId: selectedId, did, permissions, version });
      if (r.success) {
        const vcId = (r.vc as { proof?: { verificationMethod?: string } })
          ?.proof?.verificationMethod;
        setMessage({
          type: "success",
          text: "VC issued successfully.",
          vcId: vcId || undefined,
        });
      } else {
        setMessage({
          type: "error",
          text: r.message || "Failed to issue VC.",
        });
      }
    } catch (e: unknown) {
      setMessage({
        type: "error",
        text: (e as Error).message || "Request failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  // When VC is fetched and filled, scroll section into view and focus first checkbox
  useEffect(() => {
    if (
      !vcLoading &&
      vcInfo === "Loaded current VC permissions for this DID." &&
      !didScrollAfterLoadRef.current &&
      selectedId
    ) {
      didScrollAfterLoadRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = filledSectionRef.current;
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            const firstCheckbox = el.querySelector<HTMLInputElement>(
              'input[type="checkbox"]:not([disabled])'
            );
            const toFocus = firstCheckbox ?? (el as HTMLElement);
            setTimeout(() => toFocus.focus(), 150);
          }
        });
      });
    }
  }, [vcLoading, vcInfo, selectedId]);

  const idPlaceholder =
    idsLoading && idOptions.length === 0
      ? "Loading IDs…"
      : idOptions.length === 0
      ? "No IDs found for this type"
      : "Select ID…";

  return (
    <div className="card">
      <h2 className="card-title">Issue VC</h2>
      <form onSubmit={handleSubmit}>
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
        {selectedId && (
          <div
            ref={filledSectionRef}
            className="input-group"
            tabIndex={-1}
            style={{ outline: "none" }}
          >
            <label>
              Permissions for {recipientType === "client" ? "client" : "server"}
            </label>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "0.5rem",
              }}
            >
              {recipientType === "client"
                ? "Select which server APIs this client can access."
                : "Select which other servers this server can call."}
            </p>
            {vcInfo && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {vcInfo}
              </p>
            )}
            <div className="permissions-grid">
              {permissionOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="permission-chip"
                  title={opt.description}
                >
                  <input
                    type="checkbox"
                    checked={permissions.includes(opt.value)}
                    onChange={() => togglePerm(opt.value)}
                    disabled={vcLoading}
                  />
                  <span className="permission-chip-label">{opt.label}</span>
                  {opt.description && (
                    <span className="permission-chip-desc">
                      {opt.description}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="input-group">
          <label>Version (optional)</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Issuing…" : "Issue VC"}
        </button>
      </form>
      {message && (
        <div style={{ marginTop: "0.75rem" }}>
          <span
            className={
              message.type === "success" ? "pill pill-success" : "pill pill-error"
            }
          >
            {message.text}
          </span>
          {message.vcId && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              VC ID (for revoke): {message.vcId}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
