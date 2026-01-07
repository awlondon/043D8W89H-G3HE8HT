#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/scripts/dev/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to start Postgres." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required to start services." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required to start ocr-service and optimization-service." >&2
  exit 1
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/rebar_platform}"

echo "Starting local Postgres..."
docker compose -f "$COMPOSE_FILE" up -d

echo "Generating Prisma client..."
pnpm --filter services/core-api prisma generate

echo "Running Prisma migrations..."
pnpm --filter services/core-api prisma migrate dev --name init --skip-seed

echo "Starting services..."
pnpm --filter services/core-api dev &
python3 -m uvicorn main:app --reload --port 8001 --app-dir "$ROOT_DIR/services/ocr-service" &
python3 -m uvicorn main:app --reload --port 8002 --app-dir "$ROOT_DIR/services/optimization-service" &

echo "Starting frontends..."
pnpm --filter apps/web-dashboard dev &
pnpm --filter apps/field-tablet-app start &
pnpm --filter apps/voice-sales-agent-api start &

wait
