# Lynn Portfolio

## About
A React portfolio and project collection for Lynn, an emerging developer and designer building thoughtful digital experiences.

## Features
- Responsive portfolio with Bootstrap 5
- React and Vite application
- Bootstrap Icons and React Router navigation
- Skills, services, journey, education, and contact sections
- Bakery Shop coming-soon project
- APEX Hardware e-commerce project
- Search, filters, sorting, product details, deals, and cart flow
- LocalStorage cart persistence
- Frontend checkout UI with M-Pesa and Cash on Delivery options
- Social media display and responsive design

## Projects
1. **Bakery Shop**: Hearth & Crumb is a coming-soon bakery brand with product previews, categories, an opening-list form, and launch messaging.
2. **APEX Hardware**: A Kenyan-focused hardware storefront with 20 sample products, 16 categories, product details, search, filters, a cart, and checkout demonstration.

## Technologies
- React
- Vite
- Bootstrap 5
- Bootstrap Icons
- React Router DOM
- JavaScript / JSX

## Installation

```bash
cd frontend
npm install
npm run dev
```

## Build

Run from `frontend/`:

```bash
npm run build
```

## Preview

Run from `frontend/`:

```bash
npm run preview
```

## Project Structure

- `frontend/`: React + Vite application, frontend environment file, dependencies, and build output
- `frontend/src/components/`: reusable navigation, portfolio, product, cart, checkout, and layout components
- `frontend/src/pages/`: routed portfolio, bakery, hardware, product details, and not-found pages
- `frontend/src/data/`: project, category, product, and social profile data
- `frontend/src/App.jsx`: application routes
- `frontend/assets/`: existing favicon and portfolio assets
- `backend/`: Express API, backend environment file, PostgreSQL store, and legacy JSON import data
- `README.md`: project overview and shared setup instructions

## Social Media

The configured display accounts are centralized in `frontend/src/data/socialLinks.js`:

- Instagram: `lynrunsit`
- Facebook: `Linet Nimoh`
- TikTok: `Maybel`

Account URLs remain blank until Linet supplies the exact verified profile URLs. Search-result URLs are not used as substitutes. Update the social links in the admin preview or `frontend/src/data/socialLinks.js`.

## Contact

- Email: `linetwairimu020@gmail.com`
- Phone: `+254 715 808 885`

## Routes

- `/` — portfolio
- `/about` and `/contact` — aliases to the portfolio page
- `/projects` — redirects to the portfolio projects section
- `/bakery` — Hearth & Crumb coming-soon concept
- `/haven` — Haven project placeholder
- `/hardware` — APEX Hardware storefront demo
- `/hardware/product/:id` — APEX Hardware product detail demo
- `/login` — account login
- `/register` — public standard-account registration
- `/?view=admin` and `/?view=admin&section=projects` (or `services`, `skills`, `profile`, `social-links`, `messages`, `settings`) — administrator dashboard view

Login and registration are available at `/login` and `/register` as standalone views. Registration collects first and last name, email, optional phone, and password; successful registration offers a link to sign in. The optional phone is stored privately and is not included in public user responses. The admin dashboard remains at `/?view=admin` with sections selected using `&section=...`. Old query-style login and registration URLs redirect to the separate routes, while legacy `/admin/...` URLs redirect to the admin view. Authentication uses the backend session; registration creates ordinary accounts only. Admin access is checked by the server. Password reset is not implemented.

The contact form validates and sends messages to the backend for private PostgreSQL storage; the admin inbox can read, mark, and delete submissions. The APEX cart is browser-persisted; checkout, payment choices, and order confirmation are demonstrations and do not process a real order.

## Backend and authentication

The backend is a separate Express app in `backend/`. It supports health checks, registration, login, logout, current-session lookup, administrator authorization, persistent PostgreSQL-backed portfolio content management, a public contact submission endpoint, and a protected admin message inbox. Uploads and password reset are not implemented.

Install and run the applications in separate terminals. Frontend settings belong in `frontend/.env`; PostgreSQL credentials belong only in `backend/.env`.

```powershell
# Terminal 1: frontend
Set-Location .\frontend
npm install
npm run dev

# Terminal 2: backend
Set-Location .\backend
npm install
npm run dev
```

Configure the frontend API URL in `frontend/.env` using `frontend/.env.example`. Configure PostgreSQL and backend settings in `backend/.env` using `backend/.env.example`. Do not put database credentials in frontend files: Vite bundles frontend environment variables into browser code. The API uses Argon2id password hashes, opaque HTTP-only SameSite session cookies, persisted server-side sessions, CSRF tokens for state-changing requests, explicit credentialed CORS origins, and rate limits on login and registration.

Legacy JSON files under `backend/data/` are imported into PostgreSQL on first database initialization; PostgreSQL becomes the runtime source of truth and the old files are not modified. Public portfolio reads include only published content and enabled social links. Public registration cannot assign roles. Promote an existing account with the documented `npm run provision:admin` process, which requires explicit email confirmation, preserves account credentials, revokes sessions, and verifies the role through PostgreSQL. See [`backend/README.md`](./backend/README.md) for database setup, the exact command, and verification steps.

The local PostgreSQL database is the authoritative backend store. Production still needs HTTPS, backups, deployment secret management, monitoring, and a reviewed database deployment configuration.

## Verification and local development

Run frontend commands from `frontend/`: `npm install`, `npm run dev`, `npm run build`, or `npm run preview`. Run `npm test` from `backend/` for the backend test suite.
