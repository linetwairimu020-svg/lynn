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
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Project Structure

- `src/components/`: reusable navigation, portfolio, product, cart, checkout, and layout components
- `src/pages/`: routed portfolio, bakery, hardware, product details, and not-found pages
- `src/data/`: project, category, product, and social profile data
- `src/App.jsx`: application routes
- `src/App.css`: brand styling and special layouts
- `src/index.css`: global typography and base styles
- `assets/`: existing favicon and portfolio assets

## Social Media

The configured display accounts are centralized in `src/data/socialLinks.js`:

- Instagram: `lynrunsit`
- Facebook: `Linet Nimoh`
- TikTok: `Maybel`

Account URLs remain blank until Linet supplies the exact verified profile URLs. Search-result URLs are not used as substitutes. Update the social links in the admin preview or `src/data/socialLinks.js`.

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

Login and registration share one two-tab authentication screen available at `/login` and `/register`; either route opens the same screen with the matching tab selected. Successful registration redirects to Login. The public navbar's profile icon menu contains Login and Register; it shows the Admin dashboard link only after the server confirms administrator access. The admin dashboard remains at `/?view=admin` with sections selected using `&section=...`. Old query-style login and registration URLs redirect to the separate routes, while legacy `/admin/...` URLs redirect to the admin view. Authentication uses the backend session; registration creates ordinary accounts only. Admin access is checked by the server. Password reset is not implemented. Admin content-editing controls remain a browser-local preview: changes are not persisted by the backend or published to visitors.

The contact form validates and attempts to post only when configured with an API base URL. Without an API, it displays an explicit error and points visitors to the direct email link. The APEX cart is browser-persisted; checkout, payment choices, and order confirmation are demonstrations and do not process a real order.

## Backend and authentication

The backend is a separate Express app in `backend/`. It supports health checks, registration, login, logout, current-session lookup, and administrator access checks. The admin content APIs, contact-message persistence, uploads, and password reset are not implemented. Browser-only dashboard content edits do not use the admin API.

Install and run the applications in separate terminals:

```powershell
# Terminal 1: frontend, from the project root
npm install
npm run dev

# Terminal 2: backend
Set-Location .\backend
npm install
Copy-Item .env.example .env
npm run dev
```

Configure the frontend API URL in root `.env.local` using `.env.example`; the backend configuration is in `backend/.env`, based on `backend/.env.example`. The API uses Argon2id password hashes, opaque HTTP-only SameSite session cookies, persisted server-side sessions, CSRF tokens for state-changing requests, explicit credentialed CORS origins, and rate limits on login and registration.

The JSON files are private backend files under `backend/data/`: `users.json` and `sessions.json`. The directory is git-ignored and is never served by Vite. Public registration cannot assign roles. Provision the first administrator using the documented `npm run provision:admin` command and operator-supplied environment variables. See [`backend/README.md`](./backend/README.md) for exact steps, API routes, limitations, and the migration path.

JSON-file storage is for local development and a single backend process only. It is not a hardened database or appropriate for a multi-user production deployment, shared network storage, or multiple API instances. Production needs HTTPS, operational backups, deployment secret management, and a reviewed migration to a transactional database. No database has been added.

## Verification and local development

Run `npm install`, then `npm run dev` to start the Vite development server. Run `npm run build` for the production build and `npm run preview` to serve the built output. This project currently defines no lint or automated test scripts in `package.json`.
