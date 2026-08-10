#!/bin/sh
set -eu

# read_only + tmpfs on /app/.next/server hides the image layer (starts empty).
# Copy build output before Next.js starts.
if [ -d /app/.next/server-seed ]; then
  mkdir -p /app/.next/server
  if cp -a /app/.next/server-seed/. /app/.next/server/; then
    echo "ISR server output seeded to /app/.next/server"
  else
    echo "ERROR: failed to seed /app/.next/server — check tmpfs mount" >&2
    exit 1
  fi
else
  echo "ERROR: /app/.next/server-seed missing — rebuild the Docker image" >&2
  exit 1
fi

exec "$@"
