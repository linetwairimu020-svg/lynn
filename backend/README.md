# Lynn Portfolio API

The Express application in this directory provides health checks, account authentication, portfolio content management, and contact-message handling backed by local PostgreSQL. The JSON files in `backend/data/` are imported once as legacy data when the PostgreSQL document is first initialized; after that, PostgreSQL is the only runtime source of truth.

## Requirements and installation

- Node.js 20 or later
- npm

From the project root in PowerShell:

```powershell
Set-Location .\backend
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

The React/Vite frontend runs from `frontend/` in another terminal:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL=http://localhost:3000/api` in `frontend/.env` (copy `frontend/.env.example` if needed). The API adjusts localhost/127.0.0.1 to the current local frontend host so development cookies remain same-site.

## Backend configuration

`backend/.env.example` documents the backend settings. Copy it to `backend/.env` for local overrides:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `HOST` | `127.0.0.1` | Bind interface; loopback by default |
| `PORT` | `3000` | API port |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Exact allowed frontend origins; credentials enabled |
| `SESSION_TTL_HOURS` | `8` | Server-side session lifetime (1–168 hours) |
| `APP_BASE_URL` | First configured CORS origin | Public frontend origin used to build password-reset links; production must use HTTPS |
| `RESEND_API_KEY` | (set locally) | Resend API key used only by the backend for reset email delivery |
| `RESEND_FROM_EMAIL` | (set locally) | Verified sender address/name configured in Resend |
| `PGHOST` | `127.0.0.1` | Local PostgreSQL host |
| `PGPORT` | `5432` | PostgreSQL port |
| `PGDATABASE` | `lynn_portfolio` | PostgreSQL database name |
| `PGUSER` | `postgres` | PostgreSQL user |
| `PGPASSWORD` | (set locally) | PostgreSQL password; keep private |
| `DATABASE_URL` | (optional) | Alternative full PostgreSQL connection URL |
| `DATA_DIR` | `./data` | Read-only directory for one-time legacy JSON import |

The backend loads only `backend/.env` with `dotenv`. Frontend variables belong in `frontend/.env`; never put database credentials there because Vite bundles frontend variables into browser code. Set either `DATABASE_URL` (including its PostgreSQL username and password) or the `PG*` connection settings, including a non-empty `PGPASSWORD`, in `backend/.env`. Create the local database before starting the API, for example with `createdb -U <PGUSER> <PGDATABASE>`; enter the PostgreSQL password when prompted. The backend creates its application table automatically. Never commit `.env`, database credentials, or private JSON data. `.gitignore` excludes `.env` and `data/`. CORS rejects unlisted origins and does not allow `*`.

## Start and check

From `backend/`, after configuring `backend/.env` and creating the PostgreSQL database:

```powershell
npm run dev
```

For a non-watch process, run `npm start`. Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

## Authentication endpoints

- `GET /api/auth/csrf` issues a synchronizer token for state-changing requests.
- `POST /api/auth/register` creates an ordinary user account only; an optional phone number is stored privately and excluded from public user responses.
- `POST /api/auth/login` verifies credentials and sets a session cookie.
- `POST /api/auth/password-reset` sends a one-hour reset link through Resend when the account exists. It always returns a generic `202` message to avoid account enumeration; requests are rate-limited.
- `POST /api/auth/password-reset/confirm` accepts `{ "token": "...", "password": "..." }`, consumes the token once, changes the Argon2id password hash, and revokes all active sessions.
- `GET /api/auth/me` returns safe public profile fields, persisted preferences, linked integration status, and the current session start time.
- `POST /api/auth/logout` removes the session and clears the cookies.
- `PATCH /api/user/preferences` updates the signed-in user's communication preferences, region, and timezone. The request accepts a partial object and requires the session CSRF token.
- `GET /api/admin/access` is a server-checked admin endpoint; `/api/admin/*` requests are denied unless the session belongs to an administrator.

The session cookie is HTTP-only, SameSite=Lax, and Secure in production; session records are server-side. CSRF tokens are required for mutations. Login and registration have IP-based rate limits. Passwords are hashed with Argon2id. Login failures use a generic message. Public registration rejects role fields and cannot provision administrators. For deployment, serve the UI and API on the same site (or behind a same-site reverse proxy) so the SameSite=Lax cookie is sent; configure HTTPS and exact production CORS origins.

To enable password reset, set `APP_BASE_URL`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` in the private `backend/.env`. Verify the sender domain/address in Resend before sending email. Keep the Resend key server-side; never use a `VITE_` variable for it. Reset tokens are cryptographically random, stored only as SHA-256 hashes, expire after one hour, and are invalidated after use. When delivery fails, the backend logs the provider error, removes the unused token where possible, and keeps the same generic response to prevent disclosing whether the email belongs to an account. If Resend settings are missing, the endpoint returns a uniform temporary-unavailable response before checking account existence.

Account records store `lastLoginAt`, preferences, and linked integrations. The account UI measures the current session duration from the server-issued session `createdAt`; it does not represent cumulative time across multiple sessions. Integration status is read-only in this UI and is based on provider records (`google`, `github`, or `calendar`) with a `connectedAt` timestamp. Add provider-specific OAuth authorization/callback routes that write those records only after validating provider state and tokens; do not let the browser mark an integration as connected.

## Portfolio content and contact endpoints

Public content reads return published projects, services, and skills, enabled social links, and the profile/settings singletons:

- `GET /api/content/projects`
- `GET /api/content/services`
- `GET /api/content/skills`
- `GET /api/content/social-links`
- `GET /api/content/profile`
- `GET /api/content/settings`
- `POST /api/contact-messages` — validated and rate-limited; requires a CSRF token.

Every endpoint below is protected by server-side session authentication and administrator-role checks. Mutating requests also require the session CSRF token:

- `GET /api/admin/overview` — real content counts and recent activity only for records with actual timestamps.
- `GET`, `POST /api/admin/projects`, `/services`, `/skills`, `/social-links` — list and create.
- `PUT`, `DELETE /api/admin/{projects|services|skills|social-links}/:id` — update or delete.
- `GET`, `PUT /api/admin/profile` and `/api/admin/settings` — retrieve and update singleton records.
- `GET /api/admin/messages`, `PATCH /api/admin/messages/:id` with `{ "read": true }`, `POST /api/admin/messages/:id/reply` with `{ "reply": "..." }`, and `DELETE /api/admin/messages/:id`.
- `GET /api/admin/access` — confirms administrator permission.

Record inputs are restricted to editable fields and validated server-side. IDs are generated by the backend. Public content APIs filter out unpublished records and disabled social links; message records are never available from public endpoints. Contact submissions are limited to five per IP per 15-minute window.

The reply endpoint is administrator-only and requires the session CSRF token. It stores the validated reply text, an ISO timestamp in `repliedAt`, and `status: "replied"` in the existing message record. The inbox displays the saved reply and replied badge. This records a reply in the dashboard; it does not send an email.

## Provision an existing administrator account

Register the intended account normally first, then promote it using the account's email address. The script requires the target address twice as an explicit confirmation, matches it case-insensitively after trimming, and refuses to create an account if no match exists. It changes only the existing account's role, preserves its ID, name, email, password hash, and creation time, revokes its existing sessions, and verifies the resulting role through the PostgreSQL-backed user store. It does not accept or store a plaintext password.

```powershell
Set-Location .\backend
$env:ADMIN_EMAIL = "confirmed-existing-account@example.com"
$env:ADMIN_EMAIL_CONFIRM = "confirmed-existing-account@example.com"
npm run provision:admin
Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_EMAIL_CONFIRM
```

Replace the example with the exact email address of the account you intend to authorize, keeping both variables identical. Run this command only after confirming that address. Existing sessions are signed out; sign in again after provisioning. Do not put account information in source control or leave the environment variables set in a shared shell.

## PostgreSQL storage and legacy JSON import

At startup, the API creates the `lynn_documents` table if needed and initializes each application document. On the first access to a document key, if no matching database row exists, its corresponding legacy JSON file is validated and imported. If there is no legacy file, the relevant portfolio defaults (or an empty user/session/message collection) are used. An existing database row is never replaced by a JSON file. Invalid JSON is reported and not imported. Each import and update is transactional and uses a row lock, so concurrent requests cannot lose updates.

Document keys include `users.json`, `sessions.json`, `password-resets.json`, `projects.json`, `services.json`, `skills.json`, `profile.json`, `social-links.json`, `settings.json`, and `messages.json`. User records retain their existing Argon2id hashes, roles, IDs, and normalized emails; session documents store token hashes and CSRF tokens, while password-reset documents store only reset-token hashes, user IDs, and expiration times. Contact messages are JSON objects in the `messages.json` document, with `read`, `reply`, `repliedAt`, and `status` fields. They are not rows in a `contact_messages` table, so adding reply support requires no `ALTER TABLE` migration. Older records without reply fields remain valid. The JSON files remain untouched as a backup/import source and are not updated after import. PostgreSQL is the runtime source of truth; back up the database as well as retaining the old JSON files. Never expose the database or data files publicly.

After starting the backend, verify database initialization without selecting private user or message data:

```sql
SELECT document_key FROM lynn_documents ORDER BY document_key;
```

`GET /api/health` should return the API status only after database initialization has succeeded and the server has started.

## Admin dashboard scope

Use `/login` and `/register` for the standalone authentication views. Registration collects a first and last name, email, optional phone number, and password; the combined name is stored on the user record, and the optional phone number is kept private. The admin dashboard remains at `/?view=admin`; optional sections use `/?view=admin&section=projects` (and `services`, `skills`, `profile`, `social-links`, `messages`, or `settings`). Legacy query-style login and registration URLs redirect to the separate routes, and old `/admin/...` paths redirect to the admin view.

The admin route checks the current server-backed user and calls the protected admin access endpoint. Dashboard collection and singleton edits, visibility toggles, deletes, message replies, and the contact inbox use the protected API. Public portfolio components fetch server content; successful admin changes refresh same-tab and other open tabs. When the backend is unavailable, public components can display the bundled defaults, but administrator editing reports the API error and does not save to browser storage. Existing edits previously saved only in the browser are not automatically imported; when no corresponding legacy JSON file exists, the backend initializes portfolio content from the current source-controlled defaults. Contact messages and dashboard replies are stored privately; replies are not emailed. Password reset email delivery requires the Resend settings described above, and media uploads are not implemented.

## Tests

Run `npm test` in `backend/`. Integration tests use an isolated temporary JSON test adapter and ephemeral HTTP ports, so no PostgreSQL instance or real user data is needed for the suite. They cover registration and duplicate protection, input validation and role escalation, login/session/CSRF/logout, admin authorization, content CRUD, published-content filtering, singleton and social-link persistence, contact submission and inbox protection, concurrent writes, restart persistence, corrupt-file and write-failure protection, health, and CORS. PostgreSQL startup and data import require a separately configured local PostgreSQL instance.

## Security and deployment considerations

PostgreSQL is configured as the runtime store. Keep the database bound to trusted interfaces, use a least-privilege database account, secure `.env`, and maintain tested backups. Production use additionally requires HTTPS, secret management, monitoring, and a deployment-specific security review.
