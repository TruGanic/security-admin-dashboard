import { useEffect, useState, useMemo } from "react";
import { RefreshCw, Activity, Users, Server, Cpu, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  fetchAuditStats,
  fetchDidIds,
  fetchSlaMetrics,
  type AuditStats,
  type SlaMetricsResponse,
} from "../api/dashboard";
import {
  CLIENT_PERMISSIONS,
  SERVER_PERMISSIONS,
} from "../config/permissions";
import "../styles/layout.css";

/* Theme-aligned chart palette (matches theme.css --chart-*): clear, eye-friendly on dark */
const METHOD_COLORS = ["#60A5FA", "#00E07A", "#8B5CF6", "#F59E0B", "#F87171", "#6B7280"];
const RESULT_COLORS = ["#00E07A", "#F87171"];

/* Tooltip: clear text on dark card background (Recharts defaults to black text) */
const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "#F9FAFB",
  } as React.CSSProperties,
  labelStyle: { color: "#D1D5DB", fontSize: 12 } as React.CSSProperties,
  itemStyle: { color: "#F9FAFB", fontSize: 13, fontWeight: 600 } as React.CSSProperties,
};

const STAT_CARD_STYLE: React.CSSProperties = {
  background: "var(--input-bg)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "1rem",
  minWidth: "120px",
};

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ size?: number }>;
  sub?: string;
}) {
  return (
    <div style={STAT_CARD_STYLE}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
        {Icon && <Icon size={18} style={{ color: "var(--text-muted)" }} />}
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
      {sub != null && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{sub}</div>
      )}
    </div>
  );
}

export function DashboardHome() {
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [slaMetrics, setSlaMetrics] = useState<SlaMetricsResponse | null>(null);
  const [clientCount, setClientCount] = useState<number>(0);
  const [serverCount, setServerCount] = useState<number>(0);
  const [coreCount, setCoreCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, sla, clientIds, serverIds, coreIds] = await Promise.all([
        fetchAuditStats(),
        fetchSlaMetrics(),
        fetchDidIds("client"),
        fetchDidIds("server"),
        fetchDidIds("core"),
      ]);
      setAuditStats(stats ?? null);
      setSlaMetrics(sla ?? null);
      setClientCount(Array.isArray(clientIds) ? clientIds.length : 0);
      setServerCount(Array.isArray(serverIds) ? serverIds.length : 0);
      setCoreCount(Array.isArray(coreIds) ? coreIds.length : 0);
      if (!stats && !sla) setError("Could not load dashboard data. Check Gateway and Lifecycle.");
    } catch {
      setError("Failed to load dashboard data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const methodChartData = useMemo(() => {
    if (!auditStats) return [];
    return [
      { name: "GET", count: auditStats.get, fill: METHOD_COLORS[0] },
      { name: "POST", count: auditStats.post, fill: METHOD_COLORS[1] },
      { name: "PUT", count: auditStats.put, fill: METHOD_COLORS[2] },
      { name: "PATCH", count: auditStats.patch, fill: METHOD_COLORS[3] },
      { name: "DELETE", count: auditStats.delete, fill: METHOD_COLORS[4] },
      ...(auditStats.other > 0 ? [{ name: "Other", count: auditStats.other, fill: METHOD_COLORS[5] }] : []),
    ].filter((d) => d.count > 0);
  }, [auditStats]);

  const resultChartData = useMemo(() => {
    if (!auditStats) return [];
    return [
      { name: "Granted", value: auditStats.granted, fill: RESULT_COLORS[0] },
      { name: "Denied", value: auditStats.denied, fill: RESULT_COLORS[1] },
    ].filter((d) => d.value > 0);
  }, [auditStats]);

  /** Request outcome as Success % and Failure % for bar chart */
  const outcomePercentData = useMemo(() => {
    if (!auditStats || auditStats.totalRequests === 0) return [];
    const total = auditStats.totalRequests;
    const successPct = Number(((auditStats.granted / total) * 100).toFixed(2));
    const failurePct = Number(((auditStats.denied / total) * 100).toFixed(2));
    return [
      { name: "Success", percent: successPct, count: auditStats.granted, fill: RESULT_COLORS[0] },
      { name: "Failure", percent: failurePct, count: auditStats.denied, fill: RESULT_COLORS[1] },
    ];
  }, [auditStats]);

  /** Per-service success % (uptime) and failure % (100 - uptime) for bar chart */
  const servicePercentData = useMemo(() => {
    if (!slaMetrics?.services?.length) return [];
    return slaMetrics.services.map((s) => ({
      name: s.label,
      successPercent: Number(Number(s.uptimePercent).toFixed(2)),
      failurePercent: Number((100 - Number(s.uptimePercent)).toFixed(2)),
      status: s.status,
    }));
  }, [slaMetrics]);

  return (
    <div>
      <h1 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>Dashboard</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Overview of platform stats, request audit aggregates, registered DIDs, and availability.
      </p>

      {loading && !auditStats && !slaMetrics && (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>Loading dashboard…</p>
        </div>
      )}

      {error && !auditStats && !slaMetrics && (
        <div className="card" style={{ borderColor: "var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={load} style={{ marginTop: "0.75rem" }}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {/* Overview: 6 most important stats */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h2 className="card-title" style={{ marginBottom: "1rem" }}>Overview</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "1rem",
          }}
        >
          <StatCard label="Total requests" value={auditStats?.totalRequests ?? 0} icon={Activity} />
          <StatCard label="Success" value={auditStats?.granted ?? 0} icon={ThumbsUp} sub="Granted" />
          <StatCard label="Failure" value={auditStats?.denied ?? 0} icon={ThumbsDown} sub="Denied" />
          <StatCard label="Total clients" value={clientCount} icon={Users} sub="DID clients" />
          <StatCard label="Total services" value={serverCount} icon={Server} sub="DID servers" />
          {slaMetrics != null ? (
            <StatCard
              label="Platform uptime"
              value={`${Number(slaMetrics.platformUptimePercent).toFixed(2)}%`}
              icon={Activity}
              sub={`${slaMetrics.services.length} services`}
            />
          ) : (
            <StatCard label="Core" value={coreCount} icon={Cpu} sub="DID core" />
          )}
        </div>
      </div>

      {/* Beautiful charts: Bar (requests by method) + Pie (granted vs denied) */}
      {(auditStats != null && auditStats.totalRequests > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", marginBottom: "1.25rem" }}>
          <div className="card" style={{ marginBottom: 0, flex: "1 1 400px", minWidth: "300px" }}>
            <h2 className="card-title" style={{ marginBottom: "1rem" }}>Requests by method</h2>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={methodChartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} stroke="var(--border)" />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} stroke="var(--border)" />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
                    labelStyle={CHART_TOOLTIP_STYLE.labelStyle}
                    itemStyle={CHART_TOOLTIP_STYLE.itemStyle}
                    formatter={(value: number) => [value, "Requests"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {methodChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 0, flex: "1 1 340px", minWidth: "300px" }}>
            <h2 className="card-title" style={{ marginBottom: "1rem" }}>Access result</h2>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "var(--border)" }}
                  >
                    {resultChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="var(--bg-card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
                    labelStyle={CHART_TOOLTIP_STYLE.labelStyle}
                    itemStyle={CHART_TOOLTIP_STYLE.itemStyle}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "0.85rem" }}
                    formatter={(value) => <span style={{ color: "var(--text-secondary)" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Request outcome: Success % vs Failure % bar chart */}
          <div className="card" style={{ marginBottom: 0, flex: "1 1 320px", minWidth: "280px" }}>
            <h2 className="card-title" style={{ marginBottom: "1rem" }}>Request outcome (Success vs Failure %)</h2>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outcomePercentData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: "var(--text-muted)", fontSize: 12 }} stroke="var(--border)" />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fill: "var(--text-muted)", fontSize: 12 }} stroke="var(--border)" />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
                    labelStyle={CHART_TOOLTIP_STYLE.labelStyle}
                    itemStyle={CHART_TOOLTIP_STYLE.itemStyle}
                    formatter={(value: number, _name: string, props: { payload: { count: number } }) => [`${value}% (${props.payload.count} requests)`, ""]}
                  />
                  <Bar dataKey="percent" radius={[0, 4, 4, 0]} maxBarSize={36}>
                    {outcomePercentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Service success & failure percentage bar chart (from SLA metrics) */}
      {slaMetrics != null && servicePercentData.length > 0 && (
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <h2 className="card-title" style={{ marginBottom: "0.5rem" }}>Service success & failure %</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Per-service uptime (success) and downtime (failure) from availability checks.
          </p>
          <div style={{ width: "100%", height: Math.max(280, servicePercentData.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={servicePercentData}
                margin={{ top: 12, right: 24, left: 8, bottom: 8 }}
                layout="vertical"
                barCategoryGap="12%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border)" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border)" />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
                  labelStyle={CHART_TOOLTIP_STYLE.labelStyle}
                  itemStyle={CHART_TOOLTIP_STYLE.itemStyle}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "0.85rem" }}
                  formatter={(value) => <span style={{ color: "var(--text-secondary)" }}>{value}</span>}
                />
                <Bar dataKey="successPercent" name="Success %" fill="#00E07A" radius={[0, 4, 4, 0]} stackId="a" maxBarSize={20} />
                <Bar dataKey="failurePercent" name="Failure %" fill="#F87171" radius={[0, 4, 4, 0]} stackId="a" maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
