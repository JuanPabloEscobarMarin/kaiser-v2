# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kaiser is a full-stack barbershop booking MVP. Clients book appointments, admins manage services/employees/sales, and employees have their own portal. The project is deployed on Vercel (frontend + backend as separate projects) with Supabase PostgreSQL.

## Commands

### Backend (`cd backend`)

```bash
npm run dev           # ts-node with live reload
npm run build         # tsc compile to dist/
npm run seed          # seed DB with demo users + services
npm run db:current    # show which DB .env points to
npm run db:local      # switch .env → .env.local
npm run db:supabase   # switch .env → .env.supabase
npx prisma migrate dev --name <name>   # create + apply migration
npx prisma migrate deploy              # apply pending migrations (CI/prod)
npx prisma studio                      # visual DB browser
```

### Frontend (`cd frontend`)

```bash
npm run dev     # Vite dev server at localhost:5173
npm run build   # tsc + vite build
npm run lint    # eslint
```

### Environment setup

Backend `.env` minimum:

```
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://..."
JWT_SECRET=<at-least-16-chars>
CORS_ORIGIN=http://localhost:5173
STORAGE_DRIVER=local          # use "s3" in prod
```

Frontend `.env`:

```
VITE_API_URL=http://localhost:3000/api
```

WhatsApp integration is fully optional — the app works without any `WHATSAPP_*` vars set.

## Architecture

### Backend layer stack

```
Request → Express middlewares (helmet, CORS, CSRF check, rate limit)
       → Route (requireAuth / requireAdmin / requireEmployee guard)
       → Controller (parse + call service, return response)
       → Service (business logic, throws HttpException subclasses)
       → Repository (Prisma queries, no logic)
```

- **No test suite** — no `*.test.ts` files exist; validate manually.
- `asyncHandler` in `middlewares/async-handler.ts` wraps every route so thrown exceptions reach `errorMiddleware`.
- All `HttpException` subclasses (`NotFoundException`, `ConflictException`, etc.) in `src/exceptions/HttpException.ts` are caught there and serialized to JSON.
- Zod schemas live in `src/validators/` — all route inputs are validated before reaching the controller.
- Prisma client is generated to `generated/prisma/` (not the default location) — set by `generator client { output = "../generated/prisma" }`.

### Auth

- JWT stored in **httpOnly cookie** (`jwt_token`), 2h expiry, signed with `jose`.
- Logout invalidates the token via an in-memory denylist (jti → exp). Single-instance only — if scaled horizontally, this needs Redis.
- Four middleware guards: `requireAuth`, `requireAdmin`, `requireEmployee`, `optionalAuth`.
- `req.auth` is typed as `JwtPayload { userId, role, employeeId? }` via Express global augmentation in `auth.middleware.ts`.
- Roles: `CLIENT`, `ADMIN`, `EMPLOYEE`.

### Storage

Controlled by `STORAGE_DRIVER` env var:
- `"s3"` → Supabase Storage (S3-compatible) via `@aws-sdk/client-s3`.
- `"local"` → filesystem under `LOCAL_STORAGE_DIR` (default `uploads/`).

Images are served via `/api/resources/images/:slug`.

### WhatsApp integration

`src/services/whatsapp.service.ts` + `src/routes/whatsapp.routes.ts` + `src/controllers/whatsapp.controller.ts`. Meta webhook verification uses raw body (`req.rawBody` captured in `app.ts` before JSON parsing). All vars default to empty strings — the service silently no-ops when unconfigured.

### Frontend architecture

```
src/core/
  api/          # one file per backend entity; all use api.get/post/put/delete from client.ts
  config/       # environment.ts exports API_URL from VITE_API_URL
  types/        # shared TypeScript interfaces matching backend Prisma models

src/ui/
  contexts/     # AuthContext (useAuth), NotifyContext (toast notifications)
  layouts/      # Admin, Employee, Public layouts with nav
  pages/
    admin/      # Dashboard, ServiceManager, EmployeeManager, AppointmentManager, SalesManager, InventoryManager, ProductManager, Reports, Settings
    employee/   # Dashboard, Appointments, Sales, TimeOff
    public/     # Home, Booking, ServiceDetail, Login
```

- `core/api/client.ts` — central `fetch` wrapper; throws `ApiError` on non-2xx; sends `credentials: "include"` for cookie auth; handles `FormData` (no Content-Type override).
- All API modules export plain async functions that call `api.get/post/put/delete`.
- React Router 7 (file-based routing is NOT used — routes defined manually in `src/App.tsx` or similar).
- Tailwind 4 + DaisyUI 5 for UI components.

### Database schema key relationships

- `Appointment` → belongs to `Employee` + `Service`; has optional `Booking` (1:1).
- `Booking` → links `Appointment` to `Customer` (walk-in customer, not a `User`).
- `Employee` → optionally linked to a `User` (for portal login via `userId` FK).
- `Sale` → `SaleItem[]` → `Product`; optionally linked to `Customer` and `Employee`.
- `EmployeeScheduleBlock` — blocks off time for an employee (vacation, day off, etc.).
- `BusinessSettings` — single-row table for shop config (hours, colors, images).

### Deployment (Vercel)

- **Backend**: builds with `esbuild` (bundles `src/app.ts`, externalizes node_modules). Entry point for Vercel is `api/index.ts` (the serverless function). `vercel.json` rewrites all requests to `/api`.
- **Frontend**: Vite SPA. `vercel.json` proxies `/api/*` to `https://kaiser-backend.vercel.app/api/*` and falls back all other routes to `index.html`.
- To switch DB targets locally: `npm run db:local` or `npm run db:supabase` (copies `.env.local` / `.env.supabase` → `.env`).
