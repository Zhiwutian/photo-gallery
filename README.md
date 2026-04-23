# Drive gallery

Web photo gallery backed by **Google Drive** (see `docs/PROPOSAL.md` for the full v1 build plan and sequenced AI prompts).

**Stack (bootstrap):**

- `apps/web` — Vite + React + TypeScript + Tailwind CSS 4  
- `apps/api` — Express 5 + TypeScript (`/api/health`)  
- Postgres — used from Slice 1 onward; local URL is pre-wired in the dev container

## Quick start (local machine)

Requirements: **Node 20.19+** or **22.12+** (Vite 7), **pnpm 10** (`corepack enable`). The dev container uses **Node 22**.

```bash
cd drive-gallery
corepack enable && pnpm install
pnpm dev
```

- Web: <http://localhost:5173>  
- API: <http://localhost:8080> (Vite proxies `/api` → API in dev)

## Dev Container (recommended)

1. Clone this repository to your machine.
2. Open the **folder** in VS Code / Cursor.
3. **Dev Containers: Reopen in Container**.
4. Wait for `postCreateCommand` (`pnpm install`), then run `pnpm dev`.

Postgres runs in the compose stack; `DATABASE_URL` is set for the API container (Slice 1 will use it).

More detail: **`docs/DEVCONTAINER.md`** (remote SSH, Codespaces).

## GitHub

This repo is meant to live in **its own** GitHub repository (not inside `bible-support`). After cloning from GitHub, use Dev Containers or local Node as above.

See **`docs/GITHUB.md`** for creating the remote and pushing (this environment may not have your credentials).

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

## Env templates

- `apps/web/.env.example` — `VITE_API_BASE_URL` for split deploy  
- `apps/api/.env.example` — `PORT`, `CORS_ORIGIN`, future OAuth/DB vars  

## License

Private / unlicensed until you add one.
