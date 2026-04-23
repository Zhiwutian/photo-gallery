# Drive gallery

**Repository:** [github.com/Zhiwutian/photo-gallery](https://github.com/Zhiwutian/photo-gallery) · **Git flow:** [`docs/GIT_FLOW.md`](docs/GIT_FLOW.md)

Web photo gallery backed by **Google Drive** (see `docs/PROPOSAL.md` for the full v1 build plan and sequenced AI prompts).

**Stack (bootstrap):**

- `apps/web` — Vite + React + TypeScript + Tailwind CSS 4  
- `apps/api` — Express 5 + TypeScript (`/api/health`)  
- Postgres — used from Slice 1 onward; local URL is pre-wired in the dev container

## Quick start (local machine)

Requirements: **Node 20.19+** or **22.12+** (Vite 7), **pnpm 10** (`corepack enable`), **Docker** (for Postgres). The dev container uses **Node 22**.

```bash
git clone https://github.com/Zhiwutian/photo-gallery.git
cd photo-gallery
corepack enable && pnpm install
pnpm db:up                    # Postgres 16 on localhost:5432 (see docker-compose.yml)
cp apps/api/.env.example apps/api/.env   # DATABASE_URL matches compose by default
pnpm db:migrate
pnpm dev
```

- Web: <http://localhost:5173>  
- API: <http://localhost:8080> (Vite proxies `/api` → API in dev)

To stop Postgres (data kept in a Docker volume): `pnpm db:down`. To wipe the volume: `pnpm db:reset`.

**Dev Container / Codespaces:** do **not** run `pnpm db:up` here — Postgres is already in the same compose stack, and the Docker socket is often not usable as user `node`. Use `pnpm db:migrate` if needed, then `pnpm dev`.

## Dev Container (recommended)

1. Clone this repository to your machine.
2. Open the **folder** in VS Code / Cursor.
3. **Dev Containers: Reopen in Container**.
4. Wait for `postCreateCommand` (`pnpm install` and **`pnpm db:migrate`**), then run `pnpm dev`.

Postgres runs in the compose stack with a healthcheck; the app container waits until the DB is ready. `DATABASE_URL` is set for the API (see `.devcontainer/docker-compose.yml`).

More detail: **`docs/DEVCONTAINER.md`** (remote SSH, Codespaces).

## GitHub

Canonical remote: **https://github.com/Zhiwutian/photo-gallery**. This app is **not** part of the bible-support monorepo; clone it on its own.

See **`docs/GITHUB.md`** for remotes, forks, and contribution workflow.

## Vercel (later)

For the split layout in `docs/PROPOSAL.md`, set the Vercel project **Root Directory** to **`apps/web`** and configure `VITE_API_BASE_URL` to your Render API URL. `apps/web/vercel.json` already rewrites client-side routes to `index.html`.

## Scripts

| Script        | Description                          |
|---------------|--------------------------------------|
| `pnpm dev`    | Web + API in watch mode              |
| `pnpm build`  | Production build for both apps       |
| `pnpm lint`   | ESLint                               |
| `pnpm test`   | Vitest (web + api)                   |
| `pnpm typecheck` | `tsc --noEmit` for both packages  |
| `pnpm db:up`  | Start local Postgres (`docker compose`) |
| `pnpm db:down` | Stop compose stack (keeps volume) |
| `pnpm db:reset` | Stop and remove Postgres volume   |
| `pnpm db:migrate` | Apply Drizzle SQL migrations     |
| `pnpm db:generate` | Regenerate migrations from schema |

## Env templates

- `apps/web/.env.example` — `VITE_API_BASE_URL` for split deploy  
- `apps/api/.env.example` — `PORT`, `CORS_ORIGIN`, future OAuth/DB vars  

## License

Private / unlicensed until you add one.
