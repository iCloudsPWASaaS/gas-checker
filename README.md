# Gas Checker

A full-stack SaaS for gas engineers: gas safety reports, invoices and quotes with payments, contacts, scheduling, reminders, a gas rate calculator, cloud backup and a versioned REST API for a Flutter app.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Supabase (Auth, Postgres, Storage) and Stripe.

## Features

- Full admin console for users, plans, subscriptions, invoices, payments, platform settings and audit history
- 30-day free Professional trial with no card required, then Starter / Professional / Business plans
- Email/password auth for the web (cookie session) and for mobile (Bearer access + refresh tokens)
- Invoices and quotes with line items, 20% VAT support, statuses and partial payments
- Convert a quote into a draft invoice in one request
- Gas safety report records with appliances, defects and readings JSON, including heat pump and oil records
- Jobs and job addresses with statuses, priorities, scheduling and customer links
- Schedule with repeat rules and alert offsets, plus pending/overdue reminders
- Metric and imperial gas rate calculator, pipe sizing, installation volume and a boiler manual finder
- Notification centre with unread counts and job update alerts
- Contacts for clients, installations and suppliers
- Full JSON export, download, cloud backup to Supabase Storage and merge/replace restore
- Subscription gating: protected endpoints return `402 SUBSCRIPTION_REQUIRED` after the trial
- PWA manifest and mobile-friendly dashboard

## Requirements

- Node.js 20+ (tested with Node 22)
- A Supabase project
- Optional: Stripe account for live billing

## 1. Install

```bash
npm install
```

## 2. Environment

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public origin, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable/anon key (an `ANON_KEY` fallback is also supported) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key for admin operations and provisioning |
| `NEXT_PUBLIC_SUPABASE_SCHEMA` | No | Defaults to `gas-checker` |
| `SUPABASE_STORAGE_BUCKET` | No | Defaults to `gas-checker` |
| `TRIAL_DAYS` | No | Fallback trial length before platform settings are configured (default `30`) |
| `AUTH_AUTO_CONFIRM` | No | Auto-confirm new emails in development |
| `ALLOW_DEV_SUBSCRIPTION` | No | Allow direct plan activation when Stripe is not configured |
| `STRIPE_SECRET_KEY` | No | Enables real Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | No | Verifies `/api/v1/stripe/webhook` |
| `STRIPE_PRICE_*` | No | Price IDs for starter/pro/business, monthly/yearly |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | No | Reserved for address lookup |
| `ADMIN_EMAILS` | For admin | Comma-separated standalone admin login emails |
| `ADMIN_PASSWORD` | For admin | Password for the standalone admin console |
| `ADMIN_SESSION_SECRET` | For admin | Random secret used to sign the admin session cookie |

Never expose the service role key to the browser or commit `.env.local`.

## 3. Create the database

1. Open the Supabase SQL editor and run `supabase/migrations/0001_init.sql`.
2. Run `supabase/migrations/0002_admin.sql` next.
3. Run `supabase/migrations/0003_jobs_tools_notifications.sql`.
4. In Supabase go to **Project Settings > API > Exposed schemas** and add `gas-checker`.
5. Confirm **Storage** contains the private `gas-checker` bucket (created by the first migration).
6. Optionally disable email confirmation, or keep `AUTH_AUTO_CONFIRM=true` for local development.

The migrations create all tables, indexes, RLS policies, triggers, seed plans, admin audit tables, platform settings and the storage bucket. If the schema is missing, the dashboard shows a setup screen instead of failing silently.

## 4. Run

```bash
npm run dev
```

Open http://localhost:3000. Create an account to start a 30-day Professional trial. The dashboard includes:

- `/dashboard` overview
- `/dashboard/schedule`, `/dashboard/reminders`
- `/dashboard/jobs`, `/dashboard/properties`
- `/dashboard/contacts`
- `/dashboard/invoices`, `/dashboard/quotes`
- `/dashboard/reports`
- `/dashboard/gas-rate`, `/dashboard/tools`
- `/dashboard/notifications`
- `/dashboard/backup`
- `/dashboard/settings`
- `/dashboard/billing`
- `/docs` public Flutter API reference
- `/admin` management console (admin accounts only)

## Admin console

The admin console uses **its own credentials and does not use Supabase Auth**. Set these in `.env.local` or your hosting environment:

```env
ADMIN_EMAILS=admin@gaschecker.app
ADMIN_PASSWORD=use-a-strong-password
ADMIN_SESSION_SECRET=use-a-long-random-secret
```

Restart the app and open `/admin/login`. The admin session is a signed HttpOnly cookie valid for 12 hours. Multiple admin emails can be supplied comma-separated; the shared `ADMIN_PASSWORD` is used for all of them. Customer accounts and Supabase Auth are completely separate from this login.

The admin console includes:

- Overview with users, MRR, outstanding invoices, collected revenue and recent activity
- Users directory and full account detail
- Plan creation/editing, activation, feature lists and Stripe price IDs
- Subscription creation and editing: plan, status, trial dates, billing period, cancellation and Stripe IDs
- Order/invoice browser and read-only invoice detail with payment history
- Global payments list
- Platform settings: signup switch, default trial days, support email, default currency and dashboard announcement
- Audit log for every admin change

New plans can be purchased through Stripe after adding price IDs in **Admin > Plans**. If a plan has no Stripe price, checkout falls back to the matching `STRIPE_PRICE_*` environment variables. Direct activation remains available in development when Stripe is not configured.

## Scripts

```bash
npm run dev        # development server
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run build      # production build
npm run start      # serve the production build
```

## Subscriptions and trial

- Signup provisions a profile, settings row and a `trialing` subscription on the `pro` plan for the platform `trial_days` setting (`TRIAL_DAYS` is the fallback before admin settings exist).
- Expired trials are lazily marked `expired` when the account is read.
- Business endpoints require an active trial or paid subscription.
- With Stripe configured, checkout uses hosted Checkout and the webhook updates subscription state. Without Stripe and with `ALLOW_DEV_SUBSCRIPTION=true`, choosing a plan activates it directly.

Stripe webhook URL: `https://your-domain.com/api/v1/stripe/webhook`.

## API for Flutter

Base path: `/api/v1`. Authenticate with:

```http
Authorization: Bearer <supabase_access_token>
```

Responses use `{ "data": ..., "error": null, "meta": ... }`. Errors use `{ "data": null, "error": { "code", "message", "details" } }`.

Core endpoints:

- `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout`
- `GET /plans`, `GET /subscription`, `POST /subscription/checkout|cancel|resume`
- `GET|POST /contacts`, `GET|PATCH|DELETE /contacts/:id`
- `GET|POST /invoices`, `GET|PATCH|DELETE /invoices/:id`, `GET|POST /invoices/:id/payments`
- `GET|POST /quotes`, `GET|PATCH|DELETE /quotes/:id`, `POST /quotes/:id/convert`
- `GET|POST /appointments`, `PATCH|DELETE /appointments/:id`
- `GET|POST /properties`, `GET|PATCH|DELETE /properties/:id`
- `GET|POST /jobs`, `GET|PATCH|DELETE /jobs/:id`
- `GET|POST /reminders`, `PATCH|DELETE /reminders/:id`
- `GET|POST /notifications`, `PATCH|DELETE /notifications/:id`
- `GET /report-types`, `GET|POST /reports`, `GET|PATCH|DELETE /reports/:id`
- `GET|POST /gas-rate`, `GET /dashboard/summary`
- `GET|PATCH /settings`, `PATCH /profile`
- `POST /uploads`, `GET /uploads/sign`
- `GET|POST /backup`, `POST /backup/restore`
- `GET /health`

Admin-only endpoints live under `/api/v1/admin/*` for plans, subscriptions, user roles and platform settings. They use the same Bearer/cookie auth and additionally require an admin identity.

See `/docs` in the running app for request bodies, filters and a Dart client example.

## Deploy

1. Deploy to Vercel (or any Node host) and set the production environment variables.
2. Set `NEXT_PUBLIC_SITE_URL` to the production origin.
3. Add the production URL to Supabase Auth redirect URLs.
4. Add the Stripe webhook endpoint and set `STRIPE_WEBHOOK_SECRET`.

## Project structure

```text
src/app/                 App Router pages, auth routes, /api/v1 and admin endpoints
src/app/admin/           Admin console pages
src/components/          Dashboard shell, admin UI, forms and reusable UI
src/lib/                 Auth, admin access, account/trial logic, API helpers, validation, services
supabase/migrations/     Database schema, RLS, storage, admin tables and seed data
```

## Notes

- The app intentionally uses the service-role client on the server after verifying the user, so all ownership checks happen in one place. RLS policies are still defined for defence in depth.
- Storage objects are private; uploads return a signed URL valid for 7 days.
- Gas rate results are indicative. Always follow the manufacturer and Gas Safe guidance for the appliance.
