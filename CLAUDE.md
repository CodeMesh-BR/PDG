# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This is the **PDG Dashboard** monorepo: an admin dashboard + API for managing car-detailing services, companies (clients), departments, employees, and service logs. It has two independent projects that deploy to separate subdomains:

- **`PDG-API/`** — Laravel 12 REST API (PHP 8.2/8.3), token auth via Sanctum.
- **`PDG-APP/`** — Vite + React 19 SPA (TypeScript), originally scaffolded from the "NextAdmin" Next.js template.

There is no shared root package — each half is built, tested, and deployed independently. `vendor/` at the repo root is a stray/legacy composer autoload artifact, not part of either app.

## PDG-APP (frontend)

### Commands (run from `PDG-APP/`)

```bash
corepack enable        # enables the pinned Yarn version
yarn install
yarn dev                # start Vite dev server
yarn build               # tsc --noEmit + vite build -> dist/
yarn lint                # tsc --noEmit (this IS the lint step, no eslint in CI)
yarn preview              # preview the production build
```

There is no test runner configured for the frontend; CI only type-checks (`tsc --noEmit`) and builds.

### Important architectural quirk: it's a Vite SPA dressed as Next.js

Despite folder names like `src/app/(protected)/(home)/page.tsx` and `[id]/edit/page.tsx`, **this is not a Next.js app**. It's a Vite + `react-router-dom` v6 SPA:

- Entry point is `src/main.tsx`, not a Next.js router. It statically imports every `page.tsx` and wires them into `<Routes>` inside a `<BrowserRouter basename="/PDG-DOM">`.
- `next.config.mjs` exists but is unused leftover from the original template — do not edit it expecting it to have effect.
- The `(protected)`, `(home)`, `[id]` folder-naming convention is preserved purely as a organizational pattern inherited from the Next.js template; it has no special routing meaning here. When adding a new page, you must also manually add a `<Route>` for it in `src/main.tsx`.
- `"use client"` directives appearing in some files are also inert leftovers — safe to ignore/remove opportunistically, not required.

### Structure

- `src/app/` — one folder per route, each with `page.tsx` and usually a co-located `useX.ts` hook that does data fetching for that page.
- `src/app/(protected)/layout.tsx` — the authenticated shell (wraps all protected routes as a nested `<Route>` element in `main.tsx`).
- `src/app/ClientLayout.tsx` — decides whether to show the `Sidebar`/`Header` shell based on the route (auth pages get a bare layout) and fetches the current user's `role` from `/auth/me` (caching it in `localStorage`) to decide whether to hide the sidebar for the `detailer` role.
- `src/components/` — UI components ported from the NextAdmin template (Layouts/sidebar, Layouts/header, Tables, FormElements, ui-elements, ui/ for shadcn-style primitives).
- `src/lib/api.ts` — exports `API_BASE_URL` (from `VITE_API_URL` env var, default `/api`) and `apiUrl(path)` helper. All API calls should build URLs through this rather than hardcoding `/api/...`.
- `src/services/` — feature-level API client functions (currently just charts).
- Auth token and role are stored in `localStorage` (`token`, `role`) and sent as `Authorization: Bearer <token>` — there's no cookie-based session or context provider for auth state; components read `localStorage` directly.

### Build/deploy specifics

- `vite.config.ts` sets `base: "/PDG-DOM/"` because the SPA is served from a subpath (`https://eihpostech.com/PDG-DOM/`), and `main.tsx`'s `BrowserRouter` uses matching `basename="/PDG-DOM"`. If the deploy path ever changes, both need to change together.
- Path alias `@/*` → `src/*` (also remaps `lucide-react` to its CJS build directly — this is a workaround, don't remove without checking why).
- `.env.production` sets `VITE_API_URL=https://api.eihpostech.com/api`; `.env.local`/`.env.example` for local dev against the Dockerized API.

## PDG-API (backend)

### Commands (run from `PDG-API/`, via Docker)

```bash
docker compose up -d --build              # start API (port 8080) + DB
docker compose exec api php artisan migrate
docker compose exec api php artisan migrate:fresh --seed   # reset schema + reseed
docker compose exec api php artisan db:seed --class=UserSeeder
docker compose exec api php artisan test                    # run backend tests
docker compose exec api php artisan tinker
docker compose exec api php artisan route:list
docker compose exec api php artisan optimize:clear          # clear all caches (routes/config/etc.)
```

To run a single test: `docker compose exec api php artisan test --filter=TestName` (standard Laravel/PHPUnit filtering).

Composer/PHP dependencies live at `PDG-API/api/laravel` — that's the actual Laravel root (`artisan`, `app/`, `routes/`, `database/`), not `PDG-API/` itself.

### Database

The project standard is **MySQL 8** (per `PDG-API/README.md` and recent migration history — see git log for "change to mysql" commits). Note: the `docker-compose.yml` in the working tree may show Postgres — that file is intentionally **untracked by git** (see commit "Stop tracking docker-compose.yml") so each developer can point it at their own local DB config; don't treat its current contents as authoritative. `docker-compose.web.yml` is the production/staging variant, parameterized entirely by env vars (`DB_HOST`, `DB_DATABASE`, etc., required with no defaults except `DB_CONNECTION=mysql` and `DB_PORT=3306`).

### Architecture

Standard Laravel MVC, no service/repository layer — controllers talk to Eloquent models directly. All API routes are defined in `routes/api.php` and (except `/auth/login` and `/auth/forgot-password`) are behind `auth:sanctum` middleware, i.e. require a Bearer token.

Domain models (`app/Models/`): `User` (roles include at least `worker`/`detailer`, distinguished in the frontend), `Company` (clients), `Service` (catalog of billable service types, scoped to a `Department`), `Department`, `ServiceLog` (a record of a service performed for a company, with car plate/date/qty — has an idempotency guard requiring `force: true` to log a duplicate for the same company/service/date/plate).

Controllers (`app/Http/Controllers/`) map ~1:1 to these resources (`UserController`, `CompanyController`, `ServiceController`, `DepartmentController`, `ServiceLogController`), plus:
- `UserRegistrationController` — separate `store` for creating users (handles multipart file uploads: `contract_pdf`, `work_certificate_pdf`).
- `AuthController` — login/logout/logout-all/me/forgot-password. Login issues a Sanctum token that **expires after 10 hours**. Forgot-password generates and emails a temporary random password (fails silently/logs on mail error, always returns a generic message regardless of whether the email exists, to avoid user enumeration).
- `PlateOcrController` — license-plate OCR via **Google Cloud Vision API** (`google/cloud-vision`), used by the frontend's "start service" flow to auto-read a car's plate from a photo.
- `ReportController` / `DashboardController` — read-heavy aggregate/summary endpoints (filterable by date range, user, company; paginated).

Full endpoint reference with request/response examples is in `PDG-API/README.md` — consult it before guessing a payload shape.

## CI/CD

`.github/workflows/deploy.yml` runs on every push to `main`:
1. **`test`** job: frontend `yarn lint` (tsc) + backend `php artisan test` (using SQLite in-memory-ish env from `.env.example`).
2. If tests pass, **`deploy-frontend`** and **`deploy-api`** run in parallel: both build/rsync over SSH directly to cPanel-hosted servers (no container registry, no staging environment — this pushes straight to production).
   - Frontend: `yarn build` then rsync `PDG-APP/dist/` to `FRONTEND_PATH`.
   - API: rsync `PDG-API/api/laravel/` (excluding `vendor/`, `.env`, logs, caches) to `API_PATH`, then over SSH runs `composer install --no-dev`, `php artisan optimize:clear`, `migrate --force`, `storage:link`, `config:cache`, `route:cache`.
3. The initial `APP_KEY` generation and `db:seed` are **not** part of the workflow — they're manual one-time bootstrap steps run over SSH (see root `DEPLOY_FTP.md`), since the workflow must never regenerate keys or reseed on a normal deploy.

Given this pushes directly to production with no intermediate environment, be conservative about migrations (they run automatically with `--force` on every push to `main`) — a bad migration goes live immediately.

`DEPLOY_FTP.md` at the repo root also documents the legacy manual FTP/cPanel deploy process (kept as a fallback/reference), including why `vendor/`, `bootstrap/cache/*`, and `storage/logs/*.log` must never be uploaded manually.
