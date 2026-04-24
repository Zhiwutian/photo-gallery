import "./load-env.js";
import cors from "cors";
import express from "express";
import { createAuthRouter } from "./auth/router.js";
import { createDriveRouter } from "./drive/router.js";

const app = express();
app.use(express.json());

const webOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
app.use(
  cors({
    origin: webOrigin.split(",").map((o) => o.trim()),
    credentials: true,
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.use("/api/auth", createAuthRouter());
app.use("/api/drive", createDriveRouter());

const port = Number(process.env.PORT) || 8080;

async function start(): Promise<void> {
  // Delay db import so tests can import app without requiring DATABASE_URL.
  const { verifyDatabaseConnection } = await import("./db/index.js");
  await verifyDatabaseConnection();
  app.listen(port, () => {
    console.log(`API listening on http://127.0.0.1:${port}`);
  });
}

if (process.env.VITEST !== "true") {
  void start();
}

export { app };
