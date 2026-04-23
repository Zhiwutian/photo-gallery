# Neon (Postgres) — photo-gallery

## Create a database

1. Sign in at [neon.tech](https://neon.tech) and create a project.
2. Copy the **connection string** (role, host, database). It should include `sslmode=require` for TLS.

Example shape:

```text
postgresql://USER:PASSWORD@HOST.neon.tech/neondb?sslmode=require
```

## Use with this app

- Set **`DATABASE_URL`** on **Render** (API service) to the Neon string.
- Local / dev container: set the same variable in `apps/api/.env` (never commit it).

## Branches (optional)

Neon supports **database branches** for previews (e.g. one branch per PR). Point preview Render services at a branch connection string if you adopt that workflow.

## Migrations

From repo root (with `DATABASE_URL` in the environment):

```bash
pnpm db:migrate
```

CI runs this automatically before lint/tests. Render should run migrations in **`preDeployCommand`** when you add the API service (see Slice 5 in `docs/PROPOSAL.md`).
