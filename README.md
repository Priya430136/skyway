# SkyWay Airlines

SkyWay is a full-stack airline operations platform built with TanStack Start, React, Express, PostgreSQL, Prisma, and Drizzle. It includes passenger booking flows, flight status, check-in, support tools, operations dashboards, and an administrator portal.

## Features

- Passenger flight search, booking, check-in, baggage, and trip management
- Flight status, airport, gate, and disruption views
- Operations control center and support console
- Administrator portal with role-based access control
- PostgreSQL persistence with Prisma migrations and Drizzle queries
- JWT authentication with bcrypt password hashing
- Docker Compose setup for the application and PostgreSQL
- Authentication smoke tests and production build validation

## Requirements

- Node.js 22 or newer
- npm
- PostgreSQL 16 or Docker Desktop

## Quick Start

From the repository root:

```powershell
npm install --legacy-peer-deps
Copy-Item .env.example .env
```

Update `.env` with a strong `JWT_SECRET` and a valid `DATABASE_URL`. Never commit `.env` or share its secrets.

### Local PostgreSQL

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open <http://localhost:3000>.

### Docker Compose

Docker starts PostgreSQL, waits for its health check, applies Prisma migrations, and starts the production server:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Open <http://localhost:3000>. Stop the stack with:

```powershell
docker compose down
```

The Compose database is published on host port `5433` by default so it can run alongside a Windows PostgreSQL service using port `5432`. Inside Docker, the app connects to `postgres:5432`.

## Environment

The minimum local configuration is:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/skyway_airlines
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
```

Optional integrations include Gemini, Stripe, and Supabase. Their variables are listed in `.env.example`. Password resets are currently handled by SkyWay support and do not require an email provider.

## Authentication

The browser authenticates against the Express API:

- `POST /api/auth/register` creates passenger accounts only.
- `POST /api/auth/login` returns a JWT.
- `GET /api/auth/me` validates the current JWT.
- Admin routes require a valid JWT with the `ADMIN` role.
- Client-side local storage only persists the issued token; it cannot create an authenticated identity by itself.

Staff and administrator accounts must be provisioned through a trusted admin or database process. Public registration cannot assign privileged roles.

## API and Database Checks

```powershell
Invoke-WebRequest http://localhost:3000/api/health
Invoke-WebRequest http://localhost:3000/api/db/status
```

Useful database commands:

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run db:studio
```

## Validation

```powershell
npm test
npm run lint
npm run build
```

The test suite currently covers unauthenticated access, passenger-only public registration, JWT issuance, and admin bypass rejection.

## Project Structure

```text
src/
  components/       Shared React components and portal UI
  db/               Drizzle schema, migrations, and seed helpers
  integrations/     External service integrations
  lib/              Auth, API clients, business helpers, and server functions
  routes/           TanStack file-based routes
  server/           Express API routes and services
prisma/             Prisma schema and migrations
server/             Nitro production API route adapter
tests/              Node authentication smoke tests
```

## Known Limitations

- Some external integrations require provider credentials before production use.
- ESLint reports existing Fast Refresh and hook dependency warnings, but no lint errors.
- `npm audit` reports transitive vulnerabilities in some mapping and tooling dependencies. Forced fixes may introduce breaking dependency changes and should be handled as a separate upgrade task.
- The Docker engine must be running before `docker compose` commands can start containers.

## License

This project is private and intended for the SkyWay Airlines application.
