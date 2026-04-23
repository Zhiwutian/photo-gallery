import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "";
if (!url && process.argv.some((a) => a.includes("generate"))) {
  console.warn("drizzle-kit generate: DATABASE_URL empty; using placeholder for config load");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: url || "postgresql://postgres:postgres@127.0.0.1:5432/photogallery?sslmode=disable",
  },
  strict: true,
});
