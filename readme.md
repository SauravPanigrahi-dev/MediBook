<div align="center">

# 🏥 MediBook

### A full-stack healthcare management platform for doctors, patients, and administrators

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=flat-square&logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io)

<br/>

> **MediBook** eliminates the chaos of paper-based hospital scheduling. Patients book appointments and track their health records online. Doctors manage their availability, patient queues, and prescriptions from one dashboard. Admins keep the platform healthy — approving doctors, managing users, and monitoring real-time statistics.

<br/>

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Database Schema](#-database-schema) · [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Why MediBook](#-why-medibook)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Seeding the Database](#-seeding-the-database)
- [API Reference](#-api-reference)
- [User Roles](#-user-roles)
- [Test Credentials](#-test-credentials)
- [Contributing](#-contributing)

---

## 💡 Why MediBook

Most clinic management tools are either too complex, too expensive, or locked behind proprietary systems. MediBook is an open, self-hostable alternative built with modern web technologies that any hospital, clinic, or solo practitioner can deploy.

- **No double-booking** — slot-based scheduling with configurable capacity per slot
- **Token queue system** — patients receive a token number and estimated wait time at booking
- **Emergency ready** — one-tap emergency reporting with severity triage and automatic doctor assignment
- **Role-aware** — every page, route, and button is locked to the correct role
- **Type-safe end to end** — shared TypeScript types and Zod schemas from a single OpenAPI spec

---

## ✨ Features

### 👤 Patient
- Register with a full health profile — blood group, allergies, chronic conditions, emergency contact
- Search and filter doctors by name or specialization
- Book appointments from a doctor's available weekly slots
- Receive a token number with estimated waiting time on every booking
- Track appointment status — pending, confirmed, completed, cancelled, no-show
- View prescriptions issued after each visit (medicines, dosage, frequency, duration)
- Upload and manage medical reports — Blood Test, X-Ray, MRI, CT Scan, Ultrasound, and more
- One-tap **Emergency Button** — reports patient name, age, issue type, severity, and consciousness
- View real-time ER availability across nearby hospitals
- Request ambulance dispatch with live ETA

### 🩺 Doctor
- Set weekly availability slots — day of week, time range, slot duration, and max patient capacity
- View daily patient queue with token numbers and estimated wait times
- Open individual appointment details and update status
- Write structured prescriptions with medicine name, dosage, frequency, and duration
- Block specific dates (full day or time range) for leave
- Calendar view of all upcoming appointments
- **Analytics Dashboard** — appointment trends (week / month / 3 months), revenue tracking, rating breakdown, status distribution charts

### 🛡️ Admin
- Real-time platform statistics — total doctors, patients, today's appointments, pending approvals
- Review and approve or reject doctor registrations
- Search and filter all users by role or name
- Activate or deactivate any user account instantly

### 🔐 Security
- JWT access tokens with 15-minute expiry
- HTTP-only refresh token cookies with 7-day expiry
- Automatic token rotation on refresh
- Account lockout after 5 failed login attempts (15-minute cooldown)
- Doctor registration gated behind invite codes
- Role-based guards on every API route and every frontend page

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.1.0 | UI framework |
| TypeScript | 5.9.2 | Type safety |
| Vite | 7.3+ | Build tool and dev server |
| Tailwind CSS | 4.1 | Utility-first styling |
| Radix UI | Latest | Accessible headless components |
| shadcn/ui | Latest (55 components) | Pre-built component system |
| TanStack React Query | 5.90 | Server state, caching, background refetch |
| React Hook Form + Zod | 7.55 + 3.25 | Form state and validation |
| Wouter | 3.3 | Lightweight client-side routing |
| Framer Motion | 12.23 | Page and component animations |
| Recharts | 2.15 | Analytics charts (line, bar, pie) |
| Lucide React | 0.545 | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20+ | JavaScript runtime |
| Express | 5 | HTTP server and routing |
| TypeScript | 5.9.2 | Type safety |
| Drizzle ORM | 0.45 | Type-safe database queries |
| PostgreSQL | Latest | Primary relational database |
| bcryptjs | 3.0 | Password hashing (12 rounds) |
| jsonwebtoken | 9.0 | JWT signing and verification |
| Pino | 9 | High-performance structured logging |
| pino-http | 10 | HTTP request/response logging middleware |
| Zod | 3.25 | Schema validation |

### Shared Libraries
| Package | Purpose |
|---|---|
| `@workspace/db` | Drizzle schema definitions and PostgreSQL client |
| `@workspace/api-spec` | OpenAPI 3.0 specification — single source of truth |
| `@workspace/api-zod` | Zod request/response schemas auto-generated from OpenAPI spec |
| `@workspace/api-client-react` | React Query hooks auto-generated from OpenAPI spec |

### Tooling
| Tool | Version | Purpose |
|---|---|---|
| pnpm workspaces | Latest | Monorepo package management |
| drizzle-kit | 0.31 | Schema push and migration management |
| tsx | 4.21 | TypeScript execution in development |
| esbuild | 0.27.3 | Production bundling for the API server |
| orval | 8.5 | Generates React Query hooks and Zod schemas from OpenAPI spec |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Browser                           │
│             React 19 + TanStack Query                   │
│         (artifacts/healthcare — port 5173)              │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP /api/* (proxied by Vite)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 Express 5 API Server                    │
│         (artifacts/api-server — port 8080)              │
│                                                         │
│  Auth → JWT + bcrypt      Routes → 13 route modules     │
│  Middleware → role guard   Logging → Pino + pino-http   │
└──────────────────────┬──────────────────────────────────┘
                       │  Drizzle ORM
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL                           │
│                    10 tables                            │
│  users · doctors · patients · slots · appointments      │
│  prescriptions · reviews · reports · leave_blocks       │
│  emergency_cases                                        │
└─────────────────────────────────────────────────────────┘
```

The frontend and backend are completely decoupled. In production they can be deployed independently — the React app to any static host (Vercel, Netlify, S3) and the API to any Node host (Railway, Render, EC2).

---

## 📁 Project Structure

```
MediBook/
├── artifacts/
│   ├── api-server/                     # Express REST API
│   │   └── src/
│   │       ├── index.ts                # Entry point — loads env, starts server
│   │       ├── app.ts                  # Express setup — CORS, cookies, logging
│   │       ├── lib/
│   │       │   ├── auth.ts             # JWT generation/verification, bcrypt
│   │       │   ├── auth-middleware.ts  # authenticate + allowRoles guards
│   │       │   └── logger.ts           # Pino logger config
│   │       └── routes/
│   │           ├── auth.ts             # Register, login, refresh, logout, me
│   │           ├── doctors.ts          # Doctor CRUD, dashboard, analytics, queue
│   │           ├── patients.ts         # Patient CRUD, dashboard, stats
│   │           ├── appointments.ts     # Booking, status updates, queue logic
│   │           ├── slots.ts            # Weekly slot management
│   │           ├── prescriptions.ts    # Create and fetch prescriptions
│   │           ├── reports.ts          # Medical report management
│   │           ├── reviews.ts          # Patient reviews and ratings
│   │           ├── leave-blocks.ts     # Doctor leave management
│   │           ├── emergency.ts        # Emergency cases, ER status, ambulance
│   │           ├── search.ts           # Search doctors and reports
│   │           └── admin.ts            # Admin-only management routes
│   │
│   └── healthcare/                     # React SPA
│       └── src/
│           ├── pages/
│           │   ├── landing.tsx         # Login and register page
│           │   ├── patient/
│           │   │   ├── dashboard.tsx   # Health summary, upcoming appointments
│           │   │   ├── book.tsx        # Doctor search and slot booking
│           │   │   ├── appointments.tsx
│           │   │   ├── prescriptions.tsx
│           │   │   ├── reports.tsx
│           │   │   └── profile.tsx
│           │   ├── doctor/
│           │   │   ├── dashboard.tsx   # Today's queue and stats
│           │   │   ├── availability.tsx
│           │   │   ├── calendar.tsx
│           │   │   ├── leave.tsx
│           │   │   ├── analytics.tsx   # Charts and performance metrics
│           │   │   ├── profile.tsx
│           │   │   └── appointment-detail.tsx
│           │   └── admin/
│           │       └── dashboard.tsx   # Stats, approvals, user management
│           ├── components/
│           │   ├── navbar.tsx          # Role-aware top navigation
│           │   ├── emergency-button.tsx
│           │   ├── protected-route.tsx # Role-based route guard
│           │   └── ui/                 # 55 shadcn/ui components
│           └── hooks/
│               └── use-auth.tsx        # Auth context — login, register, logout
│
├── lib/
│   ├── db/
│   │   ├── drizzle.config.cjs          # Drizzle Kit configuration
│   │   └── src/
│   │       ├── index.ts                # Database client (Pool + drizzle)
│   │       └── schema/                 # One file per table
│   │           ├── users.ts
│   │           ├── doctors.ts
│   │           ├── patients.ts
│   │           ├── slots.ts
│   │           ├── appointments.ts
│   │           ├── prescriptions.ts
│   │           ├── reviews.ts
│   │           ├── reports.ts
│   │           ├── leave-blocks.ts
│   │           └── emergency-cases.ts
│   ├── api-spec/
│   │   └── openapi.yaml                # Full OpenAPI 3.0 specification
│   ├── api-zod/                        # Zod schemas generated by orval
│   └── api-client-react/               # React Query hooks generated by orval
│
├── pnpm-workspace.yaml                 # Workspace + dependency catalog
├── pnpm-lock.yaml
├── tsconfig.base.json                  # Shared TypeScript config
└── package.json
```

---

## 🗄 Database Schema

**Database:** PostgreSQL &nbsp;·&nbsp; **ORM:** Drizzle &nbsp;·&nbsp; **Tables:** 10

```
users
├── id, name, email, password_hash
├── role: "patient" | "doctor" | "admin"
├── avatar_url, is_active, created_at
│
├──── doctors (user_id → users.id)
│     ├── specialization, qualification, experience_years
│     ├── bio, consultation_fee, license_number
│     ├── avg_rating, total_reviews, is_approved
│     │
│     ├──── slots (doctor_id → doctors.id)
│     │     └── day_of_week, start_time, end_time,
│     │         slot_duration_mins, max_patients, is_active
│     │
│     ├──── leave_blocks (doctor_id → doctors.id)
│     │     └── date, is_full_day, start_time, end_time, reason
│     │
│     └──── emergency_cases (assigned_doctor_id → doctors.id)
│           └── case_id, patient_name, age, issue_type,
│               severity, conscious, location, status
│
└──── patients (user_id → users.id)
      ├── dob, gender, blood_group, phone, address
      ├── emergency_contact, allergies, chronic_conditions
      │
      └──── appointments (patient_id + doctor_id + slot_id)
            ├── date, start_time, end_time
            ├── token_number, queue_position, estimated_wait_mins
            ├── status: pending|confirmed|completed|cancelled|no-show
            ├── payment_status, payment_amount, reason, notes
            │
            ├──── prescriptions (appointment_id)
            │     └── medicines (JSON array), instructions, valid_until
            │
            ├──── reviews (appointment_id — unique constraint)
            │     └── rating (1–5), comment
            │
            └──── reports (appointment_id — optional)
                  └── report_type, title, notes, file_path
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20 or higher |
| pnpm | 9 or higher |
| PostgreSQL | Any recent version |

Install pnpm if you don't have it:
```bash
npm install -g pnpm
```

For PostgreSQL, you can use a free cloud database — [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app) — without installing anything locally.

---

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/SauravPanigrahi-dev/MediBook.git
cd MediBook
```

**2. Install all dependencies**
```bash
pnpm install
```

**3. Create environment files**

Create `artifacts/api-server/.env`:
```env
PORT=8080
DATABASE_URL=postgresql://user:password@localhost:5432/medibook
JWT_SECRET=replace_with_a_long_random_string
JWT_REFRESH_SECRET=replace_with_a_different_long_random_string
NODE_ENV=development
DOCTOR_INVITE_CODES=INVITE2024,MEDINVITE,HEALTHPRO
```

Create `lib/db/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/medibook
```

> Use the same `DATABASE_URL` in both files.

**4. Push the database schema**
```bash
cd lib/db
pnpm push
cd ../..
```

**5. Seed test data** *(optional but recommended)*
```bash
pnpm --filter @workspace/db seed
```

**6. Start the backend** *(Terminal 1)*
```bash
cd artifacts/api-server
pnpm dev
# → Server running at http://localhost:8080
```

**7. Start the frontend** *(Terminal 2)*
```bash
cd artifacts/healthcare
pnpm dev
# → App running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

> **Windows users:** Use `.env` files instead of inline env var syntax. PowerShell inline syntax (`$env:VAR=...`) can be unreliable with pnpm. The `.env` file approach works consistently on all platforms.

---

## 🔧 Environment Variables

### `artifacts/api-server/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | ✅ | — | Port for the Express server. Use `8080`. |
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Secret for signing 15-min access tokens |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret for 7-day refresh tokens. Must differ from `JWT_SECRET`. |
| `NODE_ENV` | ✅ | — | `development` or `production` |
| `DOCTOR_INVITE_CODES` | ❌ | `INVITE2024,MEDINVITE,HEALTHPRO` | Comma-separated invite codes for doctor registration |

> ⚠️ Never commit `.env` files. They are listed in `.gitignore`.

---

## 🌱 Seeding the Database

Place `seed.ts` inside `lib/db/src/` and add this to `lib/db/package.json` scripts:

```json
"seed": "tsx src/seed.ts"
```

Then run:
```bash
pnpm --filter @workspace/db seed
```

The seed creates:

| Data | Count |
|---|---|
| Admin user | 1 |
| Doctors (Cardiology, Pediatrics, Orthopedics) | 3 |
| Patients with health profiles | 3 |
| Weekly availability slots | 5 |
| Completed appointments | 3 |
| Upcoming appointments | 2 |
| Prescriptions | 3 |
| Patient reviews | 3 |
| Medical reports | 2 |
| Leave blocks | 2 |
| Emergency cases | 3 |

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register as patient or doctor |
| `POST` | `/api/auth/login` | None | Login — returns access token |
| `POST` | `/api/auth/refresh` | Cookie | Refresh access token |
| `POST` | `/api/auth/logout` | None | Clear refresh token cookie |
| `GET` | `/api/auth/me` | Bearer | Get current authenticated user |

### Doctors
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/doctors` | Bearer | List approved doctors — filter by `specialization`, `q` |
| `GET` | `/api/doctors/:id` | Bearer | Get detailed doctor profile |
| `PUT` | `/api/doctors/:id` | Bearer | Update doctor profile |
| `GET` | `/api/doctors/:id/dashboard` | Bearer | Dashboard stats |
| `GET` | `/api/doctors/:id/analytics` | Bearer | Analytics — filter by `range` (week/month/3months) |
| `GET` | `/api/doctors/:id/queue` | Bearer | Today's patient queue with token numbers |

### Appointments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/appointments` | Bearer | List — filter by `patientId`, `doctorId`, `status`, `date` |
| `POST` | `/api/appointments` | Bearer | Book a new appointment |
| `PUT` | `/api/appointments/:id` | Bearer | Update appointment details or status |
| `POST` | `/api/appointments/:id/complete` | Bearer | Mark as completed with notes |
| `DELETE` | `/api/appointments/:id` | Bearer | Cancel an appointment |

### Slots
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/slots` | Bearer | Get slots — filter by `doctorId` |
| `POST` | `/api/slots` | Bearer | Create a weekly availability slot |
| `PUT` | `/api/slots/:id` | Bearer | Update slot settings |
| `DELETE` | `/api/slots/:id` | Bearer | Remove a slot |

### Prescriptions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/prescriptions` | Bearer | List — filter by `patientId`, `doctorId` |
| `POST` | `/api/prescriptions` | Bearer | Create a prescription |

### Reports
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reports` | Bearer | List reports — filter by patient or doctor |
| `POST` | `/api/reports` | Bearer | Upload a new report |

### Reviews
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reviews` | Bearer | List reviews for a doctor |
| `POST` | `/api/reviews` | Bearer | Submit a review (one per appointment) |

### Leave Blocks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/leave-blocks` | Bearer | Get leave entries — filter by `doctorId` |
| `POST` | `/api/leave-blocks` | Bearer | Block a date or time range |
| `DELETE` | `/api/leave-blocks/:id` | Bearer | Remove a leave entry |

### Emergency
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/emergency` | None | List all emergency cases |
| `POST` | `/api/emergency` | None | Report an emergency case |
| `GET` | `/api/emergency/er-status` | None | Nearby ER availability and wait times |
| `POST` | `/api/emergency/ambulance` | None | Request ambulance dispatch |

### Search
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/search` | Bearer | Search doctors and reports by `q`, filter by `type` |

### Admin *(admin role required)*
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Platform-wide statistics |
| `GET` | `/api/admin/pending-doctors` | Admin | Doctors awaiting approval |
| `POST` | `/api/admin/doctors/:id/approve` | Admin | Approve a doctor |
| `POST` | `/api/admin/doctors/:id/reject` | Admin | Reject and deactivate a doctor |
| `GET` | `/api/admin/users` | Admin | All users — filter by `role`, `q` |
| `POST` | `/api/admin/users/:id/toggle-active` | Admin | Activate or deactivate a user |

---

## 👥 User Roles

| Role | How to Register | Access |
|---|---|---|
| `patient` | Open registration | Patient dashboard, appointments, prescriptions, reports, emergency |
| `doctor` | Requires invite code | Doctor dashboard, queue, availability, analytics, prescriptions |
| `admin` | Seeded into database | Full platform — user management, doctor approvals, statistics |

To register as a doctor during development, use invite code: **`INVITE2024`**

---

## 🔑 Test Credentials

After seeding, use these accounts to explore the platform:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@hospital.com` | `admin123` |
| Doctor (Cardiology) | `arjun.mehta@hospital.com` | `doctor123` |
| Doctor (Pediatrics) | `priya.sharma@hospital.com` | `doctor123` |
| Doctor (Orthopedics) | `suresh.rao@hospital.com` | `doctor123` |
| Patient | `ramesh.kumar@email.com` | `patient123` |
| Patient | `sunita.patel@email.com` | `patient123` |
| Patient | `vikram.singh@email.com` | `patient123` |

> ⚠️ For local development only. Change all passwords before any public deployment.

---

## 🤝 Contributing

Contributions are welcome. Here's how to get involved:

1. **Fork** the repository
2. **Create** a feature branch — `git checkout -b feature/your-feature-name`
3. **Commit** your changes using conventional commits (see below)
4. **Push** to your branch — `git push origin feature/your-feature-name`
5. **Open** a Pull Request with a clear description of what changed and why

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org):

| Prefix | Use for |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, no logic change |
| `refactor:` | Code restructure, no feature change |
| `chore:` | Build process, dependency updates |

### Reporting Issues

Found a bug or have a suggestion? [Open an issue](https://github.com/SauravPanigrahi-dev/MediBook/issues) with a clear title, steps to reproduce, and expected vs actual behaviour.

---

<div align="center">

Built with React · Express · PostgreSQL · Drizzle ORM

⭐ If you found this useful, consider starring the repository!

</div>