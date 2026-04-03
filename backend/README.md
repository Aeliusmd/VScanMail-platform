# VScan Mail API (Express + MongoDB)

## API routes

| Method | Path | Description |
|--------|------|----------------|
| GET | `/api/customer/account?companyId=demo` | Profile, bank accounts, security & notification prefs |
| PUT | `/api/customer/account?companyId=demo` | Save partial updates (`profile`, `bankAccounts`, `security`, `notifications`) |
| GET | `/api/customer/billing?companyId=demo` | Plan type, manual & subscription usage |
| POST | `/api/customer/billing/upgrade-request` | Body: `{ companyId?, planId }` — records subscription upgrade request |

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` (local MongoDB or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)).
2. Install and run:

```bash
cd backend
npm install
npm run dev
```

The server listens on port **5000** by default.

## Frontend

In `frontend`, copy `.env.local.example` to `.env.local` so `NEXT_PUBLIC_API_URL` points at this API (default `http://localhost:5000`).

If the API is offline, the customer account page falls back to sample billing data and shows a warning banner.
