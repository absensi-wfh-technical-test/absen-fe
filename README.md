# WFH Attendance Frontend

React and TypeScript frontend for employee WFH check-in and HRD attendance monitoring. This repository can be cloned and run independently from the backend repository. The browser communicates only with the NestJS **HTTP API**; it never connects to the attendance TCP microservice.

## Requirements

- Node.js 20.19+ in the 20.x series, or Node.js 22.12+, and pnpm.
- The companion backend's MySQL database, HTTP API, and attendance microservice configured and running. Use that repository's README for database provisioning, migrations, seed, and its two backend processes.

The default local addresses are:

| Service | Address |
| --- | --- |
| Frontend development server | `http://localhost:5173` |
| Backend HTTP API | `http://localhost:3000` |
| Backend attendance TCP service | `127.0.0.1:3001` (backend-only) |

## Install and run

From this frontend repository's root directory:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173`. Vite forwards `/api` and `/health` to `http://localhost:3000` by default. Start **both** backend processes before testing check-in or monitoring. The frontend needs no MySQL credentials, JWT secret, or shared signature key.

If the HTTP API runs elsewhere, set `VITE_API_PROXY_TARGET` before starting Vite. Examples:

```powershell
# PowerShell
$env:VITE_API_PROXY_TARGET = 'http://localhost:3100'
pnpm dev
```

```bash
# Bash or another POSIX shell
VITE_API_PROXY_TARGET=http://localhost:3100 pnpm dev
```

Restart Vite after changing the proxy target. If the frontend URL differs from `http://localhost:5173`, set the backend's `FRONTEND_ORIGIN` to the browser origin.

## Demo accounts and features

After the backend seed runs, sign in with either account below. The password is the value chosen for `SEED_DEMO_PASSWORD` in the **backend** environment; this repository does not contain it.

| Role | Email | Available flows |
| --- | --- | --- |
| HRD (`ADMIN`) | `admin.hr@sample.com` | Create, update, filter, and deactivate employees; read attendance and photos |
| Employee (`EMPLOYEE`) | `developer@sample.com` | Check in with a photo; view personal attendance; replace or delete today's own attendance |

HRD cannot change attendance. An employee can replace a photo or delete only their own attendance on the same Asia/Jakarta business date. The check-in timestamp comes from the backend, not the browser.

The browser creates a non-exportable P-256 signing key for each login session and signs business API requests. The JWT and key stay in memory; refreshing the page requires signing in again. Do not put a backend secret in frontend environment variables.

## Build and checks

```bash
pnpm lint
pnpm test:navigation
pnpm build
```

`pnpm build` writes static files to `dist/`. For deployment, serve those files and route `/api` to the NestJS HTTP API **on the same browser origin**. Vite's development proxy is not a production reverse proxy. The current HTTP client uses relative `/api` URLs; serving the frontend and API on different browser origins requires an explicit routing change before release.

## Project layout

`src/features/auth`, `src/features/employees`, and `src/features/attendance` keep each feature's pages, hooks, services, components, and types together. `src/components`, `src/layouts`, and `src/lib` hold shared UI and infrastructure. The `@/` import alias points to `src`.

## Common issues

| Symptom | Check |
| --- | --- |
| Login cannot reach the API | The NestJS HTTP API is running and Vite's proxy target is correct. |
| Login is rejected | The backend seed ran, the selected account is active, and the backend demo password is correct. |
| Check-in or monitoring shows a service error | The backend attendance TCP process is running; employee master and login can still work during a TCP outage. |
| An attendance request times out | Refresh the attendance status or detail before retrying; the backend may already have committed it. |
| The production frontend receives `/api` 404 | Configure the production reverse proxy to forward `/api` to the NestJS HTTP API. |
