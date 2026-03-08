import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { publishDid, listDidIds, type DidDocumentType } from "./github";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://129.212.238.68:5173" }));
app.use(express.json({ limit: "512kb" }));

const LIFECYCLE_SERVICE_URL = process.env.LIFECYCLE_SERVICE_URL || "http://localhost:3003";

app.get("/health", (_req: Request, res: Response) => {
  res.json({ service: "security-admin-dashboard-backend", status: "active" });
});

/** Proxy to Lifecycle SLA metrics (platform availability / research component) */
app.get("/api/sla/metrics", async (_req: Request, res: Response) => {
  try {
    const r = await fetch(`${LIFECYCLE_SERVICE_URL}/api/sla/metrics`, {
      headers: { Accept: "application/json" },
    });
    const text = await r.text();
    if (!r.ok) {
      try {
        return res.status(r.status).json(JSON.parse(text));
      } catch {
        return res.status(r.status).json({ error: "Lifecycle error", body: text.slice(0, 200) });
      }
    }
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch {
      console.error("SLA metrics proxy: Lifecycle returned non-JSON (check LIFECYCLE_SERVICE_URL)");
      res.status(503).json({
        error: "Lifecycle service returned invalid response; ensure LIFECYCLE_SERVICE_URL points to the Lifecycle API (e.g. http://host:3003)",
        services: [],
        timestamp: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("SLA metrics proxy error:", e);
    res.status(503).json({
      error: "Lifecycle service unavailable",
      services: [],
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/api/did/ids", async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || "client";
    if (!["client", "server", "core"].includes(type)) {
      return res.status(400).json({ ids: [], error: "type must be client, server, or core" });
    }
    const result = await listDidIds(type as DidDocumentType);
    if (!result.success) {
      return res.status(result.error === "GITHUB_TOKEN is not set" ? 503 : 500).json(result);
    }
    res.json({ ids: result.ids ?? [] });
  } catch (e: unknown) {
    res.status(500).json({ ids: [], error: (e as Error).message });
  }
});

app.post("/api/publish-did", async (req: Request, res: Response) => {
  try {
    const { didDocument, type, id } = req.body as {
      didDocument?: Record<string, unknown>;
      type?: string;
      id?: string;
    };
    if (!didDocument || !type || !id) {
      return res.status(400).json({
        success: false,
        error: "Missing didDocument, type (client|server|core), or id",
      });
    }
    if (!["client", "server", "core"].includes(type)) {
      return res.status(400).json({ success: false, error: "type must be client, server, or core" });
    }
    const result = await publishDid(didDocument, type as DidDocumentType, id);
    res.json(result);
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("publish-did error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to publish DID",
    });
  }
});

const PORT = parseInt(process.env.PORT || "3100", 10);
const HOST = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`Dashboard backend listening on http://${HOST}:${PORT}`);
});
