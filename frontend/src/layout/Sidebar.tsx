import { LayoutDashboard, KeyRound, FileBadge, FileX, Menu } from "lucide-react";

export type NavId = "dashboard" | "key-did" | "issue-vc" | "revoke-vc";

interface SidebarProps {
  active: NavId;
  onNavigate: (id: NavId) => void;
}

const navItems: { id: NavId; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "key-did", label: "Key & DID", Icon: KeyRound },
  { id: "issue-vc", label: "Issue VC", Icon: FileBadge },
  { id: "revoke-vc", label: "Revoke VC", Icon: FileX },
];

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`sidebar-item ${active === id ? "sidebar-item-active" : ""}`}
            onClick={() => onNavigate(id)}
          >
            <span className="sidebar-icon">
              <Icon size={20} strokeWidth={2} />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="sidebar-toggle" aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>
      </div>
    </aside>
  );
}
