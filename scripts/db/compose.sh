#!/usr/bin/env bash
# Root docker-compose Postgres helpers. Inside our Dev Container, Postgres is
# already running in the same compose stack — skip Docker CLI (socket often
# unavailable to user `node`).
set -euo pipefail

cmd="${1:-}"
if [[ -z "$cmd" ]]; then
  echo "usage: $0 up|down|reset" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

if [[ "${PHOTO_GALLERY_DEVCONTAINER:-}" == "1" ]]; then
  case "$cmd" in
    up)
      echo "pnpm db:up — skipped (Dev Container: Postgres is already running on 127.0.0.1:5432)."
      echo "If the schema is missing: pnpm db:migrate"
      ;;
    down)
      echo "pnpm db:down — skipped (Dev Container: stop the container from the host instead)."
      ;;
    reset)
      echo "pnpm db:reset — skipped in Dev Container (would need host Docker access)."
      echo "To wipe data: rebuild the dev container or drop the DB from a postgres shell."
      ;;
    *)
      echo "usage: $0 up|down|reset" >&2
      exit 1
      ;;
  esac
  exit 0
fi

case "$cmd" in
  up) docker compose up -d --wait db ;;
  down) docker compose down ;;
  reset) docker compose down -v ;;
  *)
    echo "usage: $0 up|down|reset" >&2
    exit 1
    ;;
esac
