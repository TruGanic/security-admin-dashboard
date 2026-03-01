export type NavId = "dashboard" | "key-did" | "issue-vc" | "revoke-vc";

interface SidebarProps {
  active: NavId;
  onNavigate: (id: NavId) => void;
}

const navItems: { id: NavId; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "key-did", label: "Key & DID", icon: "🔑" },
  { id: "issue-vc", label: "Issue VC", icon: "✓" },
  { id: "revoke-vc", label: "Revoke VC", icon: "✕" },
];

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            className={`sidebar-item ${active === id ? "sidebar-item-active" : ""}`}
            onClick={() => onNavigate(id)}
          >
            <span className="sidebar-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button type="button" className="sidebar-toggle" aria-label="Toggle sidebar">
        ☰
      </button>
    </aside>
  );
}
