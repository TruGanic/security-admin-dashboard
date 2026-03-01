import { useState } from "react";
import { MainLayout, type NavId } from "./layout";
import {
  DashboardHome,
  KeyGen,
  PublishDid,
  IssueVC,
  RevokeVC,
} from "./components";
import type { KeyPairResult } from "./utils/keys";
import "./styles/layout.css";

export default function App() {
  const [activeNav, setActiveNav] = useState<NavId>("dashboard");
  const [lastKeyResult, setLastKeyResult] = useState<KeyPairResult | null>(null);

  const handleKeyGenerated = (result: KeyPairResult) => {
    setLastKeyResult(result);
  };

  return (
    <MainLayout activeNav={activeNav} onNavigate={setActiveNav}>
      {activeNav === "dashboard" && <DashboardHome />}
      {activeNav === "key-did" && (
        <>
          <KeyGen onGenerated={handleKeyGenerated} />
          <PublishDid keyResult={lastKeyResult} />
        </>
      )}
      {activeNav === "issue-vc" && <IssueVC />}
      {activeNav === "revoke-vc" && <RevokeVC />}
    </MainLayout>
  );
}
