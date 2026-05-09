# Complete Bug Audit Report

Date: 2026-05-09

Scope: root Next.js backend app, `lib/` modules, scripts, and separate `frontend/` Next.js app. Vendor/build output such as `node_modules`, `.next`, build directories, logs, and generated artifacts were not treated as source.

Verification performed:

- Root TypeScript check: `npx tsc --noEmit --pretty false` passed.
- Frontend TypeScript check: `npx tsc --noEmit --pretty false --incremental false` failed with real source type errors in dashboard company components.
- Frontend lint: `npm run lint` failed with 277 total problems: 164 errors and 113 warnings.
- Frontend build: `npm run build` failed because Next 16 defaults to Turbopack while the config defines a custom `webpack` function.
- Root build: first failed inside the sandbox on `.next/trace` permission; elevated retry timed out, so root build is inconclusive.

## Summary Table

| Severity | Count |
| --- | ---: |
| CRITICAL | 3 |
| HIGH | 3 |
| MEDIUM | 5 |
| LOW | 1 |
| Total | 12 |

---

## 1. CRITICAL - 2FA Can Be Bypassed During Login

Severity: CRITICAL

File: `app/api/auth/login/route.ts:40`

Related file: `lib/modules/auth/auth.service.ts:230`

### Bug

The login route only verifies 2FA if the request includes `totpCode`.

Current logic:

```ts
if (totpCode) {
  const valid = await authService.verify2FA(user.id, totpCode);
  if (!valid) {
    return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
  }
}
```

That means if a user has 2FA enabled but the attacker omits `totpCode`, the `if (totpCode)` block is skipped completely and login continues.

The service function is capable of enforcing this correctly because it returns `false` when the client has 2FA enabled and the token is invalid:

```ts
async verify2FA(userId: string, totpCode: string) {
  const client = await clientModel.findById(userId);
  if (!client.two_fa_enabled || !client.two_fa_secret) return true;

  return authenticator.verify({
    token: totpCode,
    secret: client.two_fa_secret,
  });
}
```

The route just does not call it unless the code is supplied.

### Impact

Any account with 2FA enabled can still be accessed with only email and password if the attacker omits the `totpCode` field. This defeats the purpose of 2FA.

### Fix

Always call `verify2FA()`. If 2FA is not enabled, it returns `true`. If 2FA is enabled and no code is supplied, it returns `false`.

```diff
-    // 2. Verify 2FA if enabled
-    if (totpCode) {
-      const valid = await authService.verify2FA(user.id, totpCode);
-      if (!valid) {
-        return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
-      }
-    }
+    // 2. Verify 2FA if enabled. Do not allow omission to bypass MFA.
+    const valid2fa = await authService.verify2FA(user.id, totpCode || "");
+    if (!valid2fa) {
+      return NextResponse.json(
+        { error: totpCode ? "Invalid 2FA code" : "2FA code required" },
+        { status: 401 }
+      );
+    }
```

---

## 2. CRITICAL - Clients Can Access Other Clients' Records By ID

Severity: CRITICAL

Files:

- `app/api/records/mail/[id]/route.ts:12`
- `app/api/records/mail/[id]/download/route.ts:10`
- `app/api/records/mail/[id]/resend/route.ts:11`
- `app/api/records/cheques/[id]/route.ts:11`
- `app/api/records/cheques/[id]/download/route.ts:10`
- `app/api/records/cheques/[id]/approve/route.ts:18`
- `app/api/records/cheques/[id]/reject/route.ts:18`
- `app/api/records/cheques/[id]/resend/route.ts:15`

### Bug

Several single-record routes authenticate the user but do not verify that the requested record belongs to the authenticated client's `clientId`.

Example from mail detail route:

```ts
const user = await withAuth(req);
const { id } = await params;
const item = await mailItemModel.findById(id);
return NextResponse.json(item);
```

The model lookup searches globally across client tables:

```ts
async function locateRecordById(id: string) {
  const allClients = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
  ...
  const queries = allClients.map(c =>
    sql`SELECT *, ${c.id} AS _client_id FROM ${sql.raw(`\`${c.tableName}\``)} WHERE id = ${id}`
  );
}
```

Because the route does not compare `item.client_id` to `user.clientId`, any authenticated client can request another client's record if they know or guess the UUID.

The same pattern exists for cheque routes. `chequeModel.findById(id)` also searches globally across clients.

### Impact

This is a cross-tenant data isolation vulnerability. A logged-in client could read, download, resend notifications for, approve, or reject records belonging to another organization.

### Fix

Add an ownership guard immediately after lookup in every single-record route.

For mail routes:

```diff
 export async function GET(
   req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
 ) {
   try {
     const user = await withAuth(req);
     const { id } = await params;
     const item = await mailItemModel.findById(id);
+    if (user.role === "client" && item.client_id !== user.clientId) {
+      return NextResponse.json({ error: "Not found" }, { status: 404 });
+    }
     return NextResponse.json(item);
   } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 404 });
   }
 }
```

For cheque routes, first ensure the cheque object includes the owning client ID, then check it:

```diff
 const cheque = await chequeModel.findById(id);
+const chequeClientId = cheque.mail_items?.client_id;
+if (user.role === "client" && chequeClientId !== user.clientId) {
+  return NextResponse.json({ error: "Not found" }, { status: 404 });
+}
```

Routes that perform mutations should use the same guard before calling service methods such as `approve`, `reject`, `archive`, `unarchive`, `resend`, or `download`.

---

## 3. CRITICAL - Stripe Webhook Route Is Blocked By Middleware

Severity: CRITICAL

File: `middleware.ts:20`

Related files:

- `app/api/billing/stripe/webhook/route.ts`
- `vercel.json:5`

### Bug

The middleware allows `/api/stripe/webhook` as a public route:

```ts
"/api/stripe/webhook",
```

But the real Stripe webhook route is:

```txt
/api/billing/stripe/webhook
```

The middleware protects all `/api/` routes unless they are in `publicPaths`. Therefore Stripe requests to the real route can be rejected for missing a Bearer token before reaching the webhook handler.

There is also a matching wrong path in `vercel.json`:

```json
"app/api/stripe/webhook/**": { "maxDuration": 30 }
```

The actual route is under `app/api/billing/stripe/webhook`.

### Impact

Stripe webhook events such as `checkout.session.completed`, `invoice.payment_succeeded`, and `customer.subscription.deleted` may never reach the handler. This can prevent new subscriptions from activating, prevent invoices from being saved, and prevent payment failure/cancellation states from updating.

### Fix

Update the middleware public route:

```diff
-    "/api/stripe/webhook",
+    "/api/billing/stripe/webhook",
```

Update `vercel.json`:

```diff
 {
   "functions": {
     "app/api/ai/**": { "maxDuration": 60 },
     "app/api/mail/upload/**": { "maxDuration": 60 },
-    "app/api/stripe/webhook/**": { "maxDuration": 30 }
+    "app/api/billing/stripe/webhook/**": { "maxDuration": 30 }
   }
 }
```

Also consider correcting this stale route:

```diff
-    "app/api/mail/upload/**": { "maxDuration": 60 },
+    "app/api/records/mail/upload/**": { "maxDuration": 60 },
```

---

## 4. HIGH - Checkout Accepts Arbitrary Stripe Price IDs From The Client

Severity: HIGH

File: `app/api/billing/stripe/create-checkout/route.ts:6`

Related file: `lib/modules/billing/stripe.service.ts:7`

### Bug

The route accepts a raw `priceId` from the frontend:

```ts
const checkoutSchema = z.object({
  priceId: z.string().min(1),
});
...
const { priceId } = checkoutSchema.parse(body);
const result = await stripeService.createCheckoutSession(user.clientId!, priceId);
```

This bypasses the safe server-side plan mapping already implemented in `stripeService.resolvePriceIdForPlan()`:

```ts
const PRICE_BY_PLAN: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};
```

The customer billing route uses the safer approach, but this route does not.

### Impact

A client can submit any Stripe Price ID available in the Stripe account, including old, test, discounted, or unrelated prices. This can cause undercharging, wrong subscriptions, and billing/accounting mismatches.

### Fix

Accept a controlled `planId` and resolve the Stripe price on the server.

```diff
-const checkoutSchema = z.object({
-  priceId: z.string().min(1),
-});
+const checkoutSchema = z.object({
+  planId: z.enum(["starter", "professional", "enterprise"]),
+});
...
-    const { priceId } = checkoutSchema.parse(body);
+    const { planId } = checkoutSchema.parse(body);
+    const { priceId } = stripeService.resolvePriceIdForPlan(planId);
```

The full route should then call:

```ts
const result = await stripeService.createCheckoutSession(user.clientId!, priceId);
```

---

## 5. HIGH - Frontend Production Build Fails With Next 16 Turbopack/Webpack Conflict

Severity: HIGH

Files:

- `frontend/package.json:6`
- `frontend/next.config.ts:4`

### Bug

The frontend is on Next `16.1.6`. In Next 16, production build uses Turbopack by default. The frontend config contains a custom `webpack` function:

```ts
const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
  ...
};
```

The build script is:

```json
"build": "next build"
```

Running the build fails with:

```txt
This build is using Turbopack, with a `webpack` config and no `turbopack` config.
```

### Impact

The frontend cannot produce a production build. Deployment will fail unless the platform or command overrides the bundler.

### Fix Option A: Force Webpack

This is the smallest change.

```diff
   "scripts": {
     "dev": "next dev --webpack",
     "dev:turbo": "next dev --turbopack",
-    "build": "next build",
+    "build": "next build --webpack",
     "start": "next start",
     "lint": "eslint"
   },
```

### Fix Option B: Use Turbopack Config

If the custom webpack setting is no longer required, remove it and add an explicit Turbopack config:

```diff
 const nextConfig: NextConfig = {
-  webpack: (config) => {
-    config.resolve.symlinks = false;
-    return config;
-  },
+  turbopack: {},
   async redirects() {
```

Use option A if you need `config.resolve.symlinks = false`.

---

## 6. HIGH - Frontend TypeScript Fails Because Company Type Is Missing Fields

Severity: HIGH

File: `frontend/src/types/company.ts:1`

Related files:

- `frontend/src/app/dashboard/companies/components/ClickedCompany.tsx:16`
- `frontend/src/app/dashboard/companies/components/ClickedCompany.tsx:42`
- `frontend/src/app/dashboard/companies/components/ClickedCompany.tsx:46`
- `frontend/src/app/dashboard/companies/components/CompanyRow.tsx:67`
- `frontend/src/app/dashboard/companies/components/CompanyRow.tsx:70`

### Bug

The `Company` interface does not define fields used by dashboard company components:

```ts
company.chequeValue
company.mails
company.cheques
```

Frontend TypeScript fails with:

```txt
Property 'chequeValue' does not exist on type 'Company'.
Property 'mails' does not exist on type 'Company'.
Property 'cheques' does not exist on type 'Company'.
```

### Impact

Frontend type checking fails. Depending on build settings, this can block production builds and CI.

### Fix

Add the missing fields to the shared type.

```diff
 export interface Company {
   id: string;
   starred: boolean;
   flagged: boolean;
   name: string;
   initial: string;
   avatarColor: string;
   industry: string;
   industryBadge: string;
   contact: string;
   email: string;
+  mails: number;
+  cheques: number;
   deliveries: number;
   deposits: number;
+  chequeValue: number;
   status: 'Active' | 'Pending' | 'Inactive';
   time: string;
   joined: string;
```

If some company screens do not have these values, make them optional and update render code with fallbacks:

```ts
mails?: number;
cheques?: number;
chequeValue?: number;
```

Then render as:

```ts
company.mails ?? 0
company.cheques ?? 0
company.chequeValue ?? 0
```

---

## 7. MEDIUM - Cheque Validation Sends FormData Through JSON Client

Severity: MEDIUM

File: `frontend/src/lib/api/cheques.ts:63`

Related file: `app/api/ai/validate-cheque/route.ts`

### Bug

The frontend cheque validation API sends `FormData` using `apiClient()`:

```ts
validate: (formData: FormData) =>
  apiClient<any>(`/api/ai/validate-cheque`, {
    method: "POST",
    body: formData as any,
  }),
```

But `apiClient()` always sets:

```ts
"Content-Type": "application/json"
```

The backend expects multipart form data:

```ts
const formData = await req.formData();
const mailItemId = formData.get("mailItemId") as string;
const imageFile = formData.get("image") as File;
```

For multipart uploads, the browser must set `Content-Type` with a boundary. Manually forcing JSON prevents reliable multipart parsing.

### Impact

Cheque validation can fail with missing `mailItemId`/`image`, malformed body parsing, or backend 500/400 responses.

### Fix

Use the existing `apiUpload()` helper, which does not set JSON content type.

```diff
 import { apiClient, apiUpload } from "../api-client";
 ...
-  validate: (formData: FormData) =>
-    apiClient<any>(`/api/ai/validate-cheque`, {
-      method: "POST",
-      body: formData as any,
-    }),
+  validate: (formData: FormData) =>
+    apiUpload<any>(`/api/ai/validate-cheque`, formData),
```

---

## 8. MEDIUM - Mail Search Parameter Is Accepted But Ignored

Severity: MEDIUM

Files:

- `frontend/src/app/admin/mails/page.tsx:68`
- `app/api/records/mail/route.ts:14`
- `lib/modules/records/mail.schema.ts`
- `lib/modules/records/mail.model.ts:209`

### Bug

The frontend sends a `search` query parameter:

```ts
const data = await mailApi.list({
  page,
  limit: PER_PAGE,
  status,
  search: search || undefined,
  archived: false,
  clientId,
});
```

The backend schema accepts `search`:

```ts
search: z.string().optional(),
```

But the model ignores it. `listByClient()` destructures only:

```ts
const { page = 1, limit = 20, type, status, archived, hiddenIds } = opts;
```

No SQL condition is added for search. The UI also assumes the server already filtered:

```ts
const visibleMails = mailItems; // Already filtered by server
```

### Impact

The mail search box appears to work visually but returns unfiltered or incorrectly paginated results.

### Fix

Add `search` to the model options and apply it to searchable columns.

```diff
   async listByClient(
     clientId: string,
-    opts: { page?: number; limit?: number; type?: string; status?: string; archived?: boolean; hiddenIds?: Set<string> } = {}
+    opts: { page?: number; limit?: number; type?: string; status?: string; search?: string; archived?: boolean; hiddenIds?: Set<string> } = {}
   ) {
-    const { page = 1, limit = 20, type, status, archived, hiddenIds } = opts;
+    const { page = 1, limit = 20, type, status, search, archived, hiddenIds } = opts;
```

Then add the condition:

```diff
     const conditions = [];
     if (type) conditions.push(sql`record_type = ${type}`);
     if (status) conditions.push(sql`mail_status = ${status}`);
+    if (search?.trim()) {
+      const q = `%${search.trim()}%`;
+      conditions.push(sql`(
+        irn LIKE ${q}
+        OR ocr_text LIKE ${q}
+        OR ai_summary LIKE ${q}
+      )`);
+    }
```

Also apply the same search condition to `listAllGlobal()` if global admin mail search should work.

---

## 9. MEDIUM - Cheque Download Returns Empty Document URLs

Severity: MEDIUM

Files:

- `app/api/records/cheques/[id]/download/route.ts:18`
- `lib/modules/records/cheque.model.ts:31`

### Bug

Cheque download route expects envelope/content URLs from `cheque.mail_items`:

```ts
const mailItems = (cheque as any).mail_items;
return NextResponse.json({
  id: cheque.id,
  frontUrl: mailItems?.envelope_front_url || null,
  backUrl: mailItems?.envelope_back_url || null,
  contentUrls: mailItems?.content_scan_urls || [],
});
```

But `rowToCheque()` only sets:

```ts
mail_items: { client_id: clientId },
```

So `frontUrl`, `backUrl`, and `contentUrls` are always `null` or empty for cheque downloads.

### Impact

Users clicking download for a cheque receive no usable document URLs.

### Fix

Include the envelope/content fields in `rowToCheque()`.

First add a safe parser, if one is not already available in `cheque.model.ts`:

```ts
function parseJsonSafe(value: unknown, fallback: unknown = null) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
```

Then update `rowToCheque()`:

```diff
-    mail_items: { client_id: clientId },
+    mail_items: {
+      client_id: clientId,
+      envelope_front_url: row.envelope_front_url ?? null,
+      envelope_back_url: row.envelope_back_url ?? null,
+      content_scan_urls: parseJsonSafe(row.content_scan_urls, []),
+    },
```

Update the `Cheque` type too:

```diff
-  mail_items?: { client_id: string } | null;
+  mail_items?: {
+    client_id: string;
+    envelope_front_url?: string | null;
+    envelope_back_url?: string | null;
+    content_scan_urls?: string[];
+  } | null;
```

---

## 10. MEDIUM - Single-Record Lookups Can Crash If Any Client Table Is Missing

Severity: MEDIUM

Files:

- `lib/modules/records/cheque.model.ts:57`
- `lib/modules/records/mail.model.ts:116`

### Bug

`locateChequeById()` and `locateRecordById()` build a `UNION ALL` query over every client table from the `clients` table:

```ts
const allClients = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);

const queries = allClients.map(c =>
  sql`SELECT *, ${c.id} AS _client_id FROM ${sql.raw(`\`${c.tableName}\``)} WHERE id = ${id}`
);
```

Unlike `listAllGlobal()`, these functions do not check whether the physical table exists before querying it.

The project already has repair scripts and defensive list logic, so missing dynamic tables are a known possible state.

### Impact

If one client's dynamic table is missing, a lookup for any record can fail because the generated union references a nonexistent table. That can break details, downloads, archive/unarchive, delete, approve/reject, and resend flows.

### Fix

Filter client tables to existing tables before building the union.

```diff
 async function locateRecordById(id: string) {
-  const allClients = await db.select({ id: clients.id, tableName: clients.tableName }).from(clients);
-  if (!allClients.length) return null;
+  const allClientsRaw = await db
+    .select({ id: clients.id, tableName: clients.tableName })
+    .from(clients);
+  if (!allClientsRaw.length) return null;
+
+  const [tablesResult] = await db.execute(sql`SHOW TABLES`);
+  const existingTableNames = new Set(
+    ((tablesResult as unknown) as any[]).map((row) => Object.values(row)[0] as string)
+  );
+  const allClients = allClientsRaw.filter((c) => existingTableNames.has(c.tableName));
+  if (!allClients.length) return null;
 
   const queries = allClients.map(c =>
     sql`SELECT *, ${c.id} AS _client_id FROM ${sql.raw(`\`${c.tableName}\``)} WHERE id = ${id}`
   );
```

Apply the same pattern to `locateChequeById()`.

---

## 11. MEDIUM - Invalid And Unsafe CORS Headers

Severity: MEDIUM

File: `next.config.js:16`

### Bug

The root Next config sends:

```js
{ key: "Access-Control-Allow-Credentials", value: "true" },
{ key: "Access-Control-Allow-Origin", value: "*" },
```

Browsers reject credentialed CORS responses when `Access-Control-Allow-Origin` is `*`. Also, this exposes the API broadly when it should likely be restricted to the frontend origin.

### Impact

Cross-origin API calls with credentials can fail in browsers. It also weakens the security boundary around the API.

### Fix

Use a configured frontend origin instead of `*`.

```diff
 async headers() {
+  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
   return [
     {
       source: "/api/(.*)",
       headers: [
         { key: "Access-Control-Allow-Credentials", value: "true" },
-        { key: "Access-Control-Allow-Origin", value: "*" },
+        { key: "Access-Control-Allow-Origin", value: frontendOrigin },
         { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
         { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
       ]
     }
   ]
 }
```

If multiple origins are needed, handle CORS dynamically in middleware or route handlers instead of static headers.

---

## 12. LOW - Seed Scripts Hardcode Admin/Test Passwords

Severity: LOW

Files:

- `scripts/seed_admin.ts:11`
- `scripts/seed_roles.ts:9`

### Bug

Seed scripts hardcode `password123`:

```ts
const hash = await bcrypt.hash("password123", 10);
```

They also print the credentials:

```ts
Admin created! Email: admin@vscanmail.com | Password: password123
```

### Impact

If these scripts are run in staging or production, they create predictable credentials for powerful accounts. Even if intended for local use, the scripts make it easy to accidentally introduce weak accounts.

### Fix

Require the password from an environment variable and use a stronger bcrypt cost.

```diff
-    const hash = await bcrypt.hash("password123", 10);
+    const password = process.env.SEED_ADMIN_PASSWORD;
+    if (!password) {
+      throw new Error("SEED_ADMIN_PASSWORD is required");
+    }
+    const hash = await bcrypt.hash(password, 12);
```

Avoid printing the password:

```diff
-    console.log(`Admin created! Email: admin@vscanmail.com | Password: password123`);
+    console.log(`Admin created! Email: admin@vscanmail.com`);
```

For `scripts/seed_roles.ts`, either use separate environment variables per account or generate random temporary passwords and print them once only in local development.

---

## Additional Static Analysis Notes

These are not counted in the 12 primary bugs above, but they should be cleaned up.

### Frontend Lint Summary

`npm run lint` in `frontend/` reported:

| Rule | Count | Severity |
| --- | ---: | --- |
| `@typescript-eslint/no-explicit-any` | 144 | error |
| `react-hooks/set-state-in-effect` | 14 | error |
| `react-hooks/immutability` | 3 | error |
| `react/no-unescaped-entities` | 3 | error |
| `@next/next/no-img-element` | 77 | warning |
| `@typescript-eslint/no-unused-vars` | 27 | warning |
| `react-hooks/exhaustive-deps` | 7 | warning |
| `@typescript-eslint/no-unused-expressions` | 1 | warning |
| `@next/next/no-page-custom-font` | 1 | warning |

The `any` count is high enough that it hides real API contract drift. The most important cleanup target is shared DTO typing for API responses and row models.

### Stale Frontend `.next/types` Issue

A normal frontend `npx tsc --noEmit --pretty false` initially failed because `frontend/tsconfig.json` includes `.next/types/**/*.ts`, and stale `.next/types` entries referenced files that no longer existed. Running with `--incremental false` exposed the real current source errors instead.

Potential cleanup:

```diff
   "include": [
     "next-env.d.ts",
     "**/*.ts",
     "**/*.tsx",
-    ".next/types/**/*.ts",
-    ".next/dev/types/**/*.ts",
     "**/*.mts"
   ],
```

Next can regenerate route types during build/dev. If you keep these includes, remove stale `.next` output before type checks in CI.

