export function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <span className="logo-icon">🛡</span>
        <span className="logo-text">TruGanic</span>
      </div>
      <div className="header-center">
        <input
          type="search"
          placeholder="Search DIDs, clients, logs..."
          className="header-search"
        />
      </div>
      <div className="header-right">
        <span className="admin-label">Admin</span>
        <span className="admin-email">admin@truganic.io</span>
      </div>
    </header>
  );
}
