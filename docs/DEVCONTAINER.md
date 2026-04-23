# Dev Container (standalone)

This repository includes **`.devcontainer/`** so you can develop entirely inside Docker:

1. **Clone** this repo (by itself — not required to live inside another project).
2. Open the **repository root** in VS Code or Cursor.
3. Run **Dev Containers: Reopen in Container**.

What you get:

- **Node.js 22** (Microsoft `typescript-node` image)
- **Postgres 16** on `127.0.0.1:5432` inside the compose stack, with `DATABASE_URL` preset for the API container
- **Ports:** `5173` (Vite), `8080` (API), `5432` (DB) forwarded to your host

After the container builds, from `/workspaces/drive-gallery`:

```bash
pnpm dev
```

**Remote / SSH:** Open the cloned folder on your remote host, then use the same **Reopen in Container** flow; the devcontainer metadata travels with the repo.

**GitHub Codespaces:** Codespaces will detect `.devcontainer` and offer the same environment (subject to Codespaces quotas).
