import { useState } from "react";
import { MainLayout, type NavId } from "./layout";
import {
  DashboardHome,
  KeyGen,
  IssueVC,
  RevokeVC,
  AvailabilityMetrics,
  RequestAudit,
} from "./components";
import "./styles/layout.css";

export default function App() {
  const [activeNav, setActiveNav] = useState<NavId>("dashboard");

  return (
    <MainLayout activeNav={activeNav} onNavigate={setActiveNav}>
      {activeNav === "dashboard" && <DashboardHome />}
      {activeNav === "key-did" && <KeyGen />}
      {activeNav === "issue-vc" && <IssueVC />}
      {activeNav === "revoke-vc" && <RevokeVC />}
      {activeNav === "availability" && <AvailabilityMetrics />}
      {activeNav === "request-audit" && <RequestAudit />}
    </MainLayout>
  );
}
