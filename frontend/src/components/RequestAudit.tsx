import { useEffect, useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAuditRecent, type AuditEntry } from "../api/dashboard";
import "../styles/layout.css";

const PAGE_SIZES = [10, 25, 50, 100];

export function RequestAudit() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = async () => {
    setLoading(true);
    setError(null);
    setHint(null);
    const result = await fetchAuditRecent(pageSize, page);
    if (result) {
      setEntries(result.entries);
      setTimestamp(result.timestamp);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 1);
      if (result.hint) setHint(result.hint);
    } else {
      setError("Could not load audit log. Is the Gateway running and REDIS_URL set?");
      setEntries([]);
      setTotal(0);
      setTotalPages(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [page, pageSize]);

  useEffect(() => {
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [page, pageSize]);

  return (
    <div>
      <h1 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>Request Audit</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Recent requests through the Gateway: who (DID) requested what (method + path) and whether access was granted or denied. Data is stored in Gateway Redis and does not affect the request path.
      </p>

      {loading && entries.length === 0 && (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>Loading audit log…</p>
        </div>
      )}

      {error && entries.length === 0 && (
        <div className="card" style={{ borderColor: "var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={load} style={{ marginTop: "0.75rem" }}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {(entries.length > 0 || (!loading && timestamp)) && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <h2 className="card-title" style={{ margin: 0 }}>Recent requests</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                Per page
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ padding: "0.35rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </div>
          {timestamp && (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Last updated: {timestamp}
            </p>
          )}
          {total > 0 && (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
          )}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Time</th>
                  <th style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>From (DID)</th>
                  <th style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Method</th>
                  <th style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Path</th>
                  <th style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Result</th>
                  <th style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={`${e.timestamp}-${i}`} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-primary)", wordBreak: "break-all", maxWidth: "200px" }}>
                      {e.did ?? "—"}
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <code style={{ fontSize: "0.8em", background: "var(--input-bg)", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>
                        {e.method}
                      </code>
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)", wordBreak: "break-all", maxWidth: "280px" }}>
                      {e.path}
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <span className={`pill ${e.granted ? "pill-success" : "pill-error"}`}>
                        {e.granted ? "Granted" : "Denied"}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontSize: "0.8rem", maxWidth: "180px" }}>
                      {e.reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {entries.length === 0 && !loading && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ color: "var(--text-muted)" }}>No audit entries yet.</p>
              {hint && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>{hint}</p>
              )}
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                Only requests to protected routes are logged: <code style={{ fontSize: "0.8em" }}>/api/farmer/*</code>, <code style={{ fontSize: "0.8em" }}>/api/agents/*</code>, <code style={{ fontSize: "0.8em" }}>/api/data</code>. Check Gateway logs for &quot;Audit:&quot; if Redis write fails.
              </p>
            </div>
          )}

          {(entries.length > 0 || total > 0) && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                Page {page} of {totalPages || 1}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
                disabled={loading || page >= (totalPages || 1)}
                aria-label="Next page"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
