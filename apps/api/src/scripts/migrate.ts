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
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
