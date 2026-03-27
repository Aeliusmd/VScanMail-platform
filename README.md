# VScanMail

## Local MySQL (no Docker)

1) Install **MySQL Server 8.x** (MySQL Installer on Windows).

2) Create database + user (run in MySQL Workbench or `mysql` CLI):

```sql
CREATE DATABASE IF NOT EXISTS vscanmail CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'vscanmail'@'localhost' IDENTIFIED BY 'vscanmail';
GRANT ALL PRIVILEGES ON vscanmail.* TO 'vscanmail'@'localhost';
FLUSH PRIVILEGES;
```

3) Set env in `.env.local`:
- `MYSQL_HOST=127.0.0.1`
- `MYSQL_PORT=3306`
- `MYSQL_DATABASE=vscanmail`
- `MYSQL_USER=vscanmail`
- `MYSQL_PASSWORD=vscanmail`

4) Generate and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

# VScanMail — Backend MVC Architecture

Secure Digital Mail Custodian Platform — AI Intelligence, Cheque Processing, Subscription Billing.

## Tech Stack

- **Runtime**: Next.js 15 (App Router) on Vercel
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth + TOTP 2FA
- **Payments**: Stripe (subscriptions + top-up wallet)
- **AI**: OpenAI GPT-4o Vision (extraction, summaries, tamper detection)
- **Document Analysis**: AWS Textract (signature detection)
- **Storage**: Supabase Storage (encrypted scanned images)
- **Email**: Resend (transactional notifications)
- **Validation**: Zod schemas

## MVC Architecture

```
Controller  →  app/api/**/route.ts     (parse request, validate, delegate)
Service     →  lib/services/*.ts       (business logic, orchestration)
Model       →  lib/models/*.ts         (TypeScript types, Supabase queries)
```

**Rule**: Controllers never contain business logic. Services never handle HTTP. Models never call external APIs.

## Project Structure

```
app/api/           → Controller layer (route handlers)
  auth/            → register, login, verify-email, setup-2fa
  clients/         → list (admin), detail, update
  mail/            → list, upload, detail, annotate
  cheques/         → list, detail, approve, reject
  deposits/        → batch create, update
  billing/         → usage, invoices, top-up
  stripe/          → checkout, webhook, portal
  ai/              → summarize, validate-cheque, detect-tamper
  quickbooks/      → sync, OAuth callback
  reports/         → intake, tamper, revenue, destruction

lib/               → Model + Service layer
  services/        → Business logic (auth, mail, cheque, AI, billing, stripe, etc.)
  models/          → TypeScript types + Supabase CRUD queries
  validators/      → Zod request schemas (API contract with frontend)
  config/          → Client instances (Supabase, Stripe, OpenAI, AWS, Resend)
  middleware/      → Auth verification, RBAC, rate limiting
  utils/           → IRN generator, client code, fuzzy match, amount matcher

supabase/
  migrations/      → SQL schema + seed data

middleware.ts      → Next.js edge middleware (route protection)
vercel.json        → Function timeout config
```

## Setup

```bash
# 1. Clone and install
git clone <repo-url> && cd vscanmail
npm install

# 2. Environment variables
cp .env.example .env.local
# Fill in all values (Supabase, Stripe, OpenAI, AWS, Resend)

# 3. Database
npx supabase db push

# 4. Stripe webhook listener (development)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 5. Run
npm run dev
```

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Create client account |
| POST | /api/auth/verify-email | Public | Verify OTP |
| POST | /api/auth/login | Public | Sign in + 2FA |
| GET/POST | /api/auth/setup-2fa | Client | Generate/confirm TOTP |
| GET | /api/clients | Admin | List all clients |
| GET/PATCH | /api/clients/[id] | Admin | Client detail/update |
| GET | /api/mail | Client | List mail items |
| POST | /api/mail/upload | Operator | Upload scanned mail |
| GET | /api/mail/[id] | Client | Mail item detail |
| POST | /api/mail/[id]/annotate | Operator | Save tamper annotations |
| GET | /api/cheques | Client | List cheques |
| GET | /api/cheques/[id] | Client | Cheque detail + AI results |
| POST | /api/cheques/[id]/approve | Client | Approve for deposit |
| POST | /api/cheques/[id]/reject | Client | Reject cheque |
| GET/POST | /api/deposits/batches | Operator | List/create deposit batches |
| PATCH | /api/deposits/batches/[id] | Operator | Update batch status |
| GET | /api/billing/usage | Client | Usage summary |
| GET | /api/billing/invoices | Client | Invoice list |
| POST | /api/billing/topup | Client | Top-up wallet |
| POST | /api/stripe/create-checkout | Client | Start subscription |
| POST | /api/stripe/webhook | Stripe | Handle payment events |
| POST | /api/stripe/portal | Client | Billing portal URL |
| POST | /api/ai/summarize | Operator | AI executive summary |
| POST | /api/ai/validate-cheque | Operator | 6-point cheque validation |
| POST | /api/ai/detect-tamper | Operator | Envelope tamper detection |
| GET | /api/reports/intake | Admin | Intake report |
| GET | /api/reports/tamper | Admin | Tamper incident report |
| GET | /api/reports/revenue | Admin | Revenue report |
| GET | /api/reports/destruction | Admin | Destruction due report |
| POST | /api/quickbooks/sync | Admin | Sync invoices to QB |
| GET | /api/quickbooks/callback | Public | OAuth callback |

## Deployment (Vercel)

```bash
# Connect repo to Vercel, add env vars, deploy
vercel --prod
```

Vercel Pro plan recommended for 60s function timeout (AI processing needs it).

## Team Workflow

- **Backend dev (you)**: `app/api/`, `lib/`, `supabase/`, `middleware.ts`
- **Frontend dev (teammate)**: React components, pages, layouts — consumes your API routes
- **Contract**: Zod schemas in `lib/validators/` define the request/response shapes
