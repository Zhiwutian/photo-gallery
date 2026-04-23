import "../load-env.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, pool } from "../db/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const migrationsFolder = path.join(__dirname, "../../drizzle");
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied from", migrationsFolder);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    const cause =
      err && typeof err === "object" && "cause" in err
        ? (err as { cause?: unknown }).cause
        : undefined;
    const code =
      cause && typeof cause === "object" && "code" in cause
        ? String((cause as { code?: string }).code)
        : "";
    const msg =
      cause && typeof cause === "object" && "message" in cause
        ? String((cause as { message?: unknown }).message)
        : String(err);
    if (code === "28P01" || msg.includes("password authentication failed")) {
      console.error(`
DATABASE_URL rejected by Postgres (wrong user/password or wrong server).
- Copy defaults: cp apps/api/.env.example apps/api/.env  (then edit if needed)
- Stale shell var: unset DATABASE_URL
- Port 5432 might be a different Postgres than this repo's Docker/devcontainer
`);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
