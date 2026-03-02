import { Bell, ChevronDown, Search, ShieldCheck, User } from "lucide-react";

export function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo-circle" aria-hidden>
          <ShieldCheck size={22} strokeWidth={2} />
        </div>
        <span className="logo-text">TruGanic</span>
      </div>
      <div className="header-center">
        <div className="header-search-wrap">
          <Search size={18} className="header-search-icon" strokeWidth={2} />
          <input
            type="search"
            placeholder="Search DIDs, clients, logs..."
            className="header-search"
          />
        </div>
      </div>
      <div className="header-right">
        <button type="button" className="header-icon-btn" aria-label="Notifications">
          <Bell size={20} strokeWidth={2} />
          <span className="header-notification-dot" aria-hidden />
        </button>
        <div className="header-user-block">
          <div className="header-avatar" aria-hidden>
            <User size={20} strokeWidth={2} />
          </div>
          <div className="header-user-info">
            <span className="admin-label">Admin</span>
            <span className="admin-email">admin@truganic.io</span>
          </div>
          <ChevronDown size={18} className="header-chevron" strokeWidth={2} aria-hidden />
        </div>
      </div>
    </header>
  );
}
