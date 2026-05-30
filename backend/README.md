# Rosales Portal — Backend

NestJS + Prisma + PostgreSQL API for the Rosales National High School portal.

## Stack

- **NestJS** (TypeScript, modular like Angular)
- **Prisma** (type-safe DB client + migrations)
- **PostgreSQL** (recommended host: Supabase free tier)

## First-time setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env and paste your Supabase/Neon/local Postgres URL into DATABASE_URL

npx prisma migrate dev --name init   # creates tables
npm run prisma:seed                  # optional: load a minimal sample dataset
```

## Run

```bash
npm run start:dev    # http://localhost:3000/api
```

Smoke test:
```
GET http://localhost:3000/api/health
GET http://localhost:3000/api/users
GET http://localhost:3000/api/users?role=Teacher
```

## Project layout

```
src/
  main.ts             # bootstrap, CORS, global validation
  app.module.ts       # root module
  common/             # cross-cutting (health check, future guards/filters)
  prisma/             # PrismaService (global)
  users/              # example feature module — copy this shape for the rest
prisma/
  schema.prisma       # data model
  seed.ts             # dev seed
```

## Next modules to add

Mirror the frontend's `DataService` operations: `classes`, `subjects`, `enrollments`, `activities`, `grades` (with term-grade computation), `notifications`, `audit`, plus `auth` (JWT or Supabase Auth pass-through). Each is one module folder following the `users/` shape.

## Database choice

Supabase free tier (500MB Postgres + auth) is recommended. Alternatives: Neon (serverless Postgres) or local Postgres via Docker for offline dev.
