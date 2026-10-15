# Lynn Portfolio API

The separate Express application in this directory provides health checks and account authentication using local JSON files. It does not use PostgreSQL or another database.

## Requirements and installation

- Node.js 20 or later
- npm

From the project root in PowerShell:

```powershell
Set-Location .\backend
npm install
Copy-Item .env.example .env
```

The React/Vite frontend runs from the project root in another terminal:

```powershell
npm install
npm run dev
```

Set `VITE_API_BASE_URL=http://localhost:3000/api` in the root `.env.local` (copy root `.env.example` if needed). The API adjusts localhost/127.0.0.1 to the current local frontend host so development cookies remain same-site.

## Backend configuration

`backend/.env.example` documents the backend settings. Copy it to `backend/.env` for local overrides:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `HOST` | `127.0.0.1` | Bind interface; loopback by default |
| `PORT` | `3000` | API port |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Exact allowed frontend origins; credentials enabled |
| `SESSION_TTL_HOURS` | `8` | Server-side session lifetime (1–168 hours) |
| `DATA_DIR` | `./data` | Private backend JSON storage directory |

Never commit `.env`, administrator credentials, or private JSON data. `.gitignore` excludes `.env` and `data/`. CORS rejects unlisted origins and does not allow `*`.

## Start and check

From `backend/`:

```powershell
npm run dev
```

For a non-watch process, run `npm start`. Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

## Authentication endpoints

- `GET /api/auth/csrf` issues a synchronizer token for state-changing requests.
- `POST /api/auth/register` creates an ordinary user account only.
- `POST /api/auth/login` verifies credentials and sets a session cookie.
- `GET /api/auth/me` returns safe public fields for the active session.
- `POST /api/auth/logout` removes the session and clears the cookies.
- `GET /api/admin/access` is a server-checked admin endpoint; `/api/admin/*` requests are denied unless the session belongs to an administrator.

The session cookie is HTTP-only, SameSite=Lax, and Secure in production; session records are server-side. CSRF tokens are required for mutations. Login and registration have IP-based rate limits. Passwords are hashed with Argon2id. Login failures use a generic message. Public registration rejects role fields and cannot provision administrators. For deployment, serve the UI and API on the same site (or behind a same-site reverse proxy) so the SameSite=Lax cookie is sent; configure HTTPS and exact production CORS origins.

## Provision the first administrator

There is no default account or password. Supply credentials through environment variables in the current PowerShell process and run the provisioning script:

```powershell
$env:ADMIN_NAME = "Your Name"
$env:ADMIN_EMAIL = "you@example.com"
$securePassword = Read-Host "Administrator password" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $securePassword).Password
npm run provision:admin
Remove-Item Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
$securePassword.Dispose()
```

Choose a unique password that meets the registration password rules (12–128 characters with uppercase, lowercase, and a number). Provisioning creates an admin or promotes the matching email and updates its password, then revokes its active sessions. Do not put these values in source control or leave them set in a shared shell.

## JSON files

On server start, the backend initializes these files to empty arrays if they do not exist:

- `backend/data/users.json` — user IDs, names, email and normalized email, Argon2id hashes, role, and creation time.
- `backend/data/sessions.json` — hashes of random session tokens, user IDs, CSRF token, and expiration.

Writes are serialized per file and use atomic replacement. Expired sessions are cleaned on startup and while accessed. Corrupt JSON or invalid records cause an explicit server error; existing data is not silently reset. Raw session tokens and password plaintext are never written to these files or returned to the frontend.

## Admin dashboard scope

Use `/login` and `/register` in the frontend for the shared two-tab authentication screen; each route selects its corresponding tab. After successful registration, the app redirects to the Login tab. The admin dashboard remains at `/?view=admin`; optional sections use `/?view=admin&section=projects` (and `services`, `skills`, `profile`, `social-links`, `messages`, or `settings`). In the public navbar, Login and Register are inside the profile icon menu; the Admin link appears there only after the server confirms administrator access. Legacy query-style login and registration URLs redirect to the separate routes, and old `/admin/...` paths redirect to the admin view.

The admin route checks the current server-backed user and calls the protected admin access endpoint. The existing dashboard's content editing still uses browser `localStorage`; it is not server-backed CRUD, shared between users, or published to the portfolio. The other admin/content methods in the frontend adapter have no corresponding backend implementations yet. Contact messages and password reset are also not implemented.

## Tests

Run `npm test` in `backend/`. Integration tests use temporary JSON directories and ephemeral HTTP ports; they cover registration and duplicate protection, input validation and role escalation, login/session/CSRF/logout, admin authorization, persistence across a server restart, corrupt-file protection, health, and CORS.

## Security limitations and migration

JSON files are suitable only for local development and a single backend process. Per-process serialized writes do not coordinate across multiple workers or servers, and these files do not provide database transactions, robust operational backups, or production-grade access controls. Do not deploy this as a multi-user production account system. Production use requires HTTPS, protected secret and data management, backups, monitoring, and a security review.

For a later migration, define database-backed user and session repositories behind the existing service interfaces, migrate normalized emails and Argon2id hashes without exporting plaintext passwords, migrate only unexpired sessions if desired (or force sign-in), verify role constraints and authorization tests, then deploy with a reviewed rollback and backup plan. No database is configured by this stage.
