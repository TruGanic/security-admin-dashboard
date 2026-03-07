import "dotenv/config";
import path from "path";
import express, { Request, Response } from "express";
import cors from "cors";
import { publishDid, listDidIds, type DidDocumentType } from "./github";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
app.use(cors({ origin: process.env.CORS_ORIGIN || (isProduction ? undefined : "http://localhost:5173") }));
app.use(express.json({ limit: "512kb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ service: "security-admin-dashboard-backend", status: "active" });
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

// In production, serve frontend static files and SPA fallback
if (isProduction) {
  const publicDir = path.join(__dirname, "..", "public");
  app.use(express.static(publicDir));
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

const PORT = parseInt(process.env.PORT || "3100", 10);
app.listen(PORT, () => {
  console.log(`Dashboard backend listening on http://localhost:${PORT}`);
});
