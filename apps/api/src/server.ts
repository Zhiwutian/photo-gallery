import cors from "cors";
import express from "express";

const app = express();

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

const port = Number(process.env.PORT) || 8080;

if (process.env.VITEST !== "true") {
  app.listen(port, () => {
    console.log(`API listening on http://127.0.0.1:${port}`);
  });
}

export { app };
