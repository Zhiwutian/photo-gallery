# drive-gallery inside the bible-support devcontainer

If you clone **photo-gallery** (this app) as **`/workspace/drive-gallery`** inside the **bible-support** monorepo and use **that** repo’s Dev Container (`.devcontainer` at `/workspace`), you share one machine and **one Postgres** listening on `127.0.0.1:5432`.

## What goes wrong

- **bible-support** uses `DATABASE_URL` like `postgres://dev:dev@localhost/bible_support` (see `server/.env.example` in the parent repo).
- **drive-gallery** defaults assume `postgresql://postgres:postgres@127.0.0.1:5432/photogallery`.

Connecting with `postgres` / `postgres` hits the **same** server as bible-support, which expects user **`dev`** with password **`dev`**. You get Postgres **`28P01` (password authentication failed for user "postgres"`)**.

## Fix

1. Copy env and point at the **same** Postgres with the **correct** user:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

2. In `apps/api/.env`, set:

   ```bash
   DATABASE_URL=postgresql://dev:dev@127.0.0.1:5432/photogallery?sslmode=disable
   ```

3. Create the database once (if it does not exist):

   ```bash
   createdb photogallery
   # or: psql "$DATABASE_URL_FROM_SERVER_DOTENV" -c 'CREATE DATABASE photogallery;'
   ```

4. Run migrations:

   ```bash
   pnpm db:migrate
   ```

## Alternatives

- Open **only** the photo-gallery folder and use **its** `.devcontainer` (dedicated Postgres with `postgres:postgres`).
- Or run a **second** Postgres on another port via Docker on the host and set `DATABASE_URL` accordingly (not wired in bible-support compose today).
