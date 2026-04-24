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

## OAuth (Slice 2)

- API routes:
  - `GET /api/auth/google/start`
  - `GET /api/auth/google/callback`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- Setup guide: **`docs/deployment/google-oauth.md`**
- API env: copy `apps/api/.env.example` to `apps/api/.env` and fill Google + session values.

## Drive gallery (Slice 3)

- **Web routes:** `/photos` (enter a Drive folder ID), `/photos/folder/:folderId` (grid + lightbox; `fetch` uses `credentials: "include"`).
- **API routes** (session required; refresh token from Slice 2):
  - `GET /api/drive/folders/:folderId/files?pageToken=&pageSize=&q=`
  - `GET /api/drive/files/:fileId/meta?folderId=`
  - `GET /api/drive/files/:fileId/media?folderId=` (streams bytes only after a parent-chain check under `folderId`)
- Optional: `DRIVE_RATE_LIMIT_MAX` (default 240/min per IP) on the API.

## GitHub

Canonical remote: **https://github.com/Zhiwutian/photo-gallery**. This app is **not** part of the bible-support monorepo; clone it on its own.

If you still keep a copy under **`/workspace/drive-gallery`** while using the **bible-support** devcontainer, read **`docs/development/nested-workspace-bible-support.md`** — that environment’s Postgres uses different credentials than this repo’s defaults.

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

Env loading: `apps/api/.env.example` supplies defaults for unset keys; **`apps/api/.env` overrides the shell and the example** (so a committed-free local file fixes a stale `DATABASE_URL` in your environment). If `pnpm db:migrate` fails with **password authentication failed**, another Postgres may be on `127.0.0.1:5432`, or your shell has the wrong `DATABASE_URL` — use `apps/api/.env` from the example or `unset DATABASE_URL`, then migrate again.

## License

Private / unlicensed until you add one.
