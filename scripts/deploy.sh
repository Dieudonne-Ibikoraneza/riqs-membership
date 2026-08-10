#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

FOLLOW_LOGS=false
ACTION=up
PULL=false

usage() {
  cat <<'USAGE'
Usage: ./scripts/deploy.sh [options]

Options:
  --pull       Fast-forward the repository before deploying.
  --logs       Follow frontend logs after deployment.
  --down       Stop the frontend instead of deploying it.
  -h, --help   Show this help.
USAGE
}

while (($#)); do
  case "$1" in
    --pull) PULL=true ;;
    --logs) FOLLOW_LOGS=true ;;
    --down) ACTION=down ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

command -v docker >/dev/null 2>&1 || { echo "Docker is required but was not found." >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose v2 is required." >&2; exit 1; }

if [[ "$PULL" == true ]]; then
  command -v git >/dev/null 2>&1 || { echo "Git is required for --pull." >&2; exit 1; }
  echo "Pulling the latest frontend commit..."
  git pull --ff-only
fi

if [[ "$ACTION" == "down" ]]; then
  docker compose down
  exit 0
fi

if [[ ! -f .env ]]; then
  echo "Missing frontend/.env. Copy .env.example to .env and set NEXT_PUBLIC_API_URL." >&2
  exit 1
fi

echo "Building and starting the RIQS frontend..."
docker compose up --build -d
docker compose ps
echo "Frontend URL: http://localhost:${WEB_PORT:-3000}"

if [[ "$FOLLOW_LOGS" == true ]]; then
  exec docker compose logs -f web
fi
