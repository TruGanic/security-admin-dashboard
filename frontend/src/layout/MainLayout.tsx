import { Header } from "./Header";
import { Sidebar, NavId } from "./Sidebar";

interface MainLayoutProps {
  activeNav: NavId;
  onNavigate: (id: NavId) => void;
  children: React.ReactNode;
}

export function MainLayout({ activeNav, onNavigate, children }: MainLayoutProps) {
  return (
    <div className="app-layout">
      <Header />
      <Sidebar active={activeNav} onNavigate={onNavigate} />
      <main className="main-content">{children}</main>
    </div>
  );
}
