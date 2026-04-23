import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  throw new Error(
    "DATABASE_URL is required (e.g. from apps/api/.env or the dev container). See apps/api/.env.example.",
  );
}

const pool = new pg.Pool({
  connectionString: url,
  max: Number(process.env.PG_POOL_MAX ?? 10),
});

export { pool };
export const db = drizzle(pool, { schema });

export async function verifyDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("select 1");
  } finally {
    client.release();
  }
}
