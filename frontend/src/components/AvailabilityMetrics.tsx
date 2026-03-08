import { useEffect, useState, useMemo } from "react";
import { Activity, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fetchSlaMetrics, type SlaMetricsResponse } from "../api/dashboard";
import "../styles/layout.css";

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

export function AvailabilityMetrics() {
  const [data, setData] = useState<SlaMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchSlaMetrics();
    setData(result);
    if (!result) setError("Could not load metrics. Is the Lifecycle service running?");
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const serviceBarData = useMemo(() => {
    if (!data?.services?.length) return [];
    return data.services.map((s) => ({
      name: s.label,
      successPercent: Number(Number(s.uptimePercent).toFixed(2)),
      failurePercent: Number((100 - Number(s.uptimePercent)).toFixed(2)),
      status: s.status,
      samples: s.samples,
    }));
  }, [data]);

  return (
    <div>
      <h1 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>Platform Availability</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Research component: continuous health polling and SLA aggregation to measure and improve platform availability. The Lifecycle service polls all platform and blockchain services every 30s and exposes these metrics for visibility and evaluation.
      </p>

      {loading && !data && (
        <div className="card">
          <p style={{ color: "var(--text-muted)" }}>Loading metrics…</p>
        </div>
      )}

      {error && !data && (
        <div className="card" style={{ borderColor: "var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={load} style={{ marginTop: "0.75rem" }}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h2 className="card-title">Platform uptime (rolling window)</h2>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)", margin: "0.5rem 0" }}>
              {Number(data.platformUptimePercent).toFixed(3)}%
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Last updated: {data.timestamp} · Window: last{" "}
              {data.windowMinutes >= 24 * 60
                ? `${Math.round(data.windowMinutes / (24 * 60))} days`
                : data.windowMinutes >= 60
                  ? `${Math.round(data.windowMinutes / 60)} hours`
                  : `${data.windowMinutes} min`}
            </p>
          </div>

          <div className="card">
            <h2 className="card-title">Per-service availability</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {data.services.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    background: "var(--input-bg)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Activity
                      size={20}
                      color={
                        s.status === "up"
                          ? "var(--accent)"
                          : s.status === "down"
                            ? "var(--danger)"
                            : "var(--text-muted)"
                      }
                    />
                    <span style={{ fontWeight: 500 }}>{s.label}</span>
                    <span
                      className={`pill ${s.status === "up" ? "pill-success" : s.status === "down" ? "pill-error" : ""}`}
                      style={
                        s.status === "unknown"
                          ? { background: "rgba(107, 114, 128, 0.2)", color: "var(--text-muted)" }
                          : undefined
                      }
                    >
                      {s.status}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {Number(s.uptimePercent).toFixed(3)}%
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                      ({s.samples} samples)
                    </span>
                    {s.lastChecked && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        Last check: {new Date(s.lastChecked).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={load}
              disabled={loading}
              style={{ marginTop: "1rem" }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {/* Bar chart: success & failure % per service (health checks) */}
          {serviceBarData.length > 0 && (
            <div className="card" style={{ marginTop: "1.25rem" }}>
              <h2 className="card-title" style={{ marginBottom: "0.5rem" }}>Per-service success & failure (health checks)</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                One bar per service: green = success % (uptime), red = failure % (downtime). Based on the same health check samples as above.
              </p>
              <div style={{ width: "100%", height: Math.max(320, serviceBarData.length * 48) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={serviceBarData}
                    margin={{ top: 12, right: 24, left: 8, bottom: 8 }}
                    layout="vertical"
                    barCategoryGap="14%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border)" />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: "var(--text-muted)", fontSize: 11 }} stroke="var(--border)" />
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
                    <Bar dataKey="successPercent" name="Success %" fill="#00E07A" radius={[0, 4, 4, 0]} stackId="a" maxBarSize={24} />
                    <Bar dataKey="failurePercent" name="Failure %" fill="#F87171" radius={[0, 4, 4, 0]} stackId="a" maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
