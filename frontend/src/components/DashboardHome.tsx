import "../styles/layout.css";

export function DashboardHome() {
  return (
    <div>
      <h1 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>Dashboard</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Use the sidebar: Key & DID to generate keys and publish DIDs, Issue VC to grant permissions, Revoke VC to revoke.
      </p>
      <div className="card">
        <h2 className="card-title">Quick actions</h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
          Generate key pair → Publish DID to GitHub → Issue VC with permissions. Then the client app can use CLIENT_DID and CLIENT_PRIVATE_KEY in .env to call the Gateway.
        </p>
      </div>
    </div>
  );
}
