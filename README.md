# Rosales Portal

Online Class Record System for Rosales National High School, built around the DepEd MATATAG 3-term curriculum.

## Stack

- **Frontend** — Angular 21 (TypeScript, Angular Material, signals, zoneless)
- **Backend** — NestJS 10 (TypeScript) + Prisma 5 + PostgreSQL (Supabase free tier)
- **Auth** — JWT issued by NestJS, bcrypt-hashed passwords, forced password change on first login

## Project layout

```
.
├── frontend/   # Angular app (port 4200)
├── backend/    # NestJS API (port 3000)
└── README.md
```

Each folder has its own README with setup instructions:

- [frontend/README.md](frontend/README.md)
- [backend/README.md](backend/README.md)

## Quickstart

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env            # fill in DATABASE_URL + DIRECT_URL from Supabase
npx prisma migrate deploy       # or db push for dev
npm run prisma:seed             # load realistic sample data
npm run start:dev               # http://localhost:3000/api

# 2. Frontend (new terminal)
cd frontend
npm install
npm start                       # http://localhost:4200
```

## Default credentials after seed

| Role | Identifier | Password |
|------|------------|----------|
| Teacher | email or `T-1001` | `T-1001` (employee ID) |
| Student | email or `S-30001` | `S-30001` (student ID) |

All seeded users are forced to change their password on first login.

## Domain model

DepEd MATATAG curriculum — 3 terms per school year. Each term has Written Work (30%), Performance Tasks (50%), and Term Assessment (20%), with the standard DepEd transmuted-grade scale.
