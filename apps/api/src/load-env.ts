import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(apiRoot, ".env");
const examplePath = path.join(apiRoot, ".env.example");

// Defaults from .env.example — never override vars already set by the shell / CI.
dotenv.config({ path: examplePath, override: false });

// Explicit apps/api/.env wins over shell and .env.example (local dev).
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}
