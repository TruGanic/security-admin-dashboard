import {
  CLIENT_PERMISSIONS,
  SERVER_PERMISSIONS,
} from "../config/permissions";
import "../styles/layout.css";

export function DashboardHome() {
  return (
    <div>
      <h1 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>Dashboard</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Use the sidebar: Key & DID to generate keys and publish DIDs, Issue VC
        to grant permissions, Revoke VC to revoke.
      </p>
      <div className="card">
        <h2 className="card-title">Quick actions</h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Generate key pair → Publish DID to GitHub → Issue VC with permissions.
          Then the client app can use CLIENT_DID and CLIENT_PRIVATE_KEY in .env
          to call the Gateway.
        </p>
      </div>
      <div className="card">
        <h2 className="card-title">Permissions you can grant</h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
          When issuing a VC, choose recipient type (Client or Server), then
          select from the permissions below. Policy checks use the format{" "}
          <code style={{ fontSize: "0.85em" }}>action:resource</code> (e.g.{" "}
          <code style={{ fontSize: "0.85em" }}>write:farmer</code> for POST
          /api/farmer/...).
        </p>
        <div className="permissions-reference-section">
          <h3 className="permissions-reference-title">For clients</h3>
          <p className="permissions-reference-desc">
            Grant these so a client can access server APIs (e.g. farmer, data).
          </p>
          <div className="permissions-reference-list">
            {CLIENT_PERMISSIONS.map((p) => (
              <span key={p.value} className="permissions-reference-tag" title={p.description}>
                {p.value}
              </span>
            ))}
          </div>
        </div>
        <div className="permissions-reference-section">
          <h3 className="permissions-reference-title">For servers</h3>
          <p className="permissions-reference-desc">
            Grant these so a server can call other servers (server-to-server).
          </p>
          <div className="permissions-reference-list">
            {SERVER_PERMISSIONS.map((p) => (
              <span key={p.value} className="permissions-reference-tag" title={p.description}>
                {p.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
