# Healthcare Appointment System (MediBook)

## Overview

Full-stack healthcare appointment booking system with patient, doctor, and admin dashboards. Built as a pnpm workspace monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Wouter (routing)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (bcryptjs + jsonwebtoken)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle for API), Vite (frontend)

## Project Structure

- `artifacts/healthcare/` - React frontend (patient/doctor/admin dashboards)
- `artifacts/api-server/` - Express API server
- `lib/db/` - Database schema (Drizzle ORM)
- `lib/api-spec/` - OpenAPI specification
- `lib/api-client-react/` - Generated React Query hooks
- `lib/api-zod/` - Generated Zod schemas

## Key Features

- Patient registration/login with JWT auth
- Doctor registration with invite codes
- Appointment booking with time slot selection
- Token-based queue management
- Patient dashboard with health summary
- Doctor dashboard with analytics
- Admin dashboard for user management
- Reports and prescriptions management

## Test Credentials

- Patient: `patient@test.com` / `password`
- Doctor (Cardiology): `sarah@test.com` / `password`
- Doctor (Neurology): `michael@test.com` / `password`
- Doctor (General): `emily@test.com` / `password`
- Admin: `admin@test.com` / `password`

## Key Commands

- `pnpm run typecheck` - full typecheck across all packages
- `pnpm run build` - typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` - regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` - push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` - run API server locally
- `pnpm --filter @workspace/healthcare run dev` - run frontend locally
