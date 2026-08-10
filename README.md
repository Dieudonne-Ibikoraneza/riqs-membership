# RIQS Membership Frontend

Next.js client for the RIQS membership portal. It provides applicant, member,
mentor, reviewer, approver, and administrator workspaces and communicates with
the backend REST API and Socket.IO services.

## Requirements

- Node.js 22+, npm 10
- A reachable RIQS backend API
- Docker Engine and Docker Compose v2 for container deployment

## Configuration

Create the environment file:

```bash
cp .env.example .env
```

Set the public backend URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

`NEXT_PUBLIC_API_URL` is embedded into the browser bundle at build time. For a
production build, it must be the URL reachable by users' browsers, not a
Docker-internal hostname such as `http://api:5000`.

Do not put backend secrets, database credentials, SMTP passwords, JWT secrets,
or Supabase service-role keys in this file. Only `NEXT_PUBLIC_*` values intended
for browser exposure belong here.

## Local development

```bash
npm ci
npm run dev
```

The development site runs at `http://localhost:3000`.

## Build and production start

```bash
npm run build
npm start
```

The Next.js configuration uses `output: "standalone"`, so the Docker runtime
only needs the generated standalone server, static assets, and `public/` files.

## Docker deployment

The production image uses a multi-stage build, installs only the standalone
runtime output, runs as a non-root user, and exposes port 3000.

```bash
./scripts/deploy.sh
./scripts/deploy.sh --pull
./scripts/deploy.sh --logs
./scripts/deploy.sh --down
```

Equivalent Compose commands:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f web
docker compose down
```

Set `WEB_PORT` to change the host port while the container remains on 3000:

```env
WEB_PORT=3001
```

The container health check requests `/`. The frontend does not run database
migrations; those are owned by the backend deployment.

`--pull` runs `git pull --ff-only` before the Docker build and stops if the
checkout has uncommitted or divergent changes. The frontend entrypoint seeds
the Next.js server output into the writable `/app/.next/server` tmpfs before
starting Next.js.

## Build-time environment behavior

Because `NEXT_PUBLIC_API_URL` is client-visible, changing it requires a new
frontend image build:

```bash
docker compose build --no-cache web
docker compose up -d web
```

The backend must allow requests from the deployed frontend origin and expose
the required API and WebSocket endpoints.

## Troubleshooting

- API requests target localhost in production: set the public `NEXT_PUBLIC_API_URL` before rebuilding.
- Docker build fails on fonts: Next.js downloads configured Google Fonts during build; provide build network access or self-host the fonts.
- Container is unhealthy: inspect `docker compose logs web` and request `/` directly.
- Browser CORS errors: verify backend CORS configuration and the frontend origin.
- Stale API URL: rebuild the image because public environment values are build-time values.

## Repository layout

- `src/`: Next.js application source
- `public/`: static assets
- `next.config.ts`: standalone output configuration
- `Dockerfile`: production image
- `docker-compose.yml`: container orchestration
- `scripts/deploy.sh`: deployment helper
- `.env.example`: frontend configuration template
