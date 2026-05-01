# vSendDocs Public API — Integration Specification

**API Version:** 1.0 (January 2024)
**Purpose:** Implementation-ready reference for building a vSendDocs API client.
**Target stack:** Python / FastAPI (adapt for other stacks as needed).

---

## 1. Overview

REST API over HTTPS. JSON request/response. **JWT token-based authentication.**

**Flow:** Obtain token → Submit documents → Poll status → Retrieve Proof of Service PDF.

### Base URLs

| Environment | URL |
|---|---|
|
| QA / Staging | `https://devqaapi.vsendocs.com/swagger/index.html` |


All endpoints are prefixed with `/api`. Full URL pattern: `{BASE_URL}/api/{endpoint}`.

---

## 2. Authentication

### 2.1 Credentials

Two credentials are required:

| Credential | Description |
|---|---|
| **Tenant API Key** | Organizational identifier. Treat as a password. |
| **Customer Identifier** | GUID identifying the user account within the tenant. |

### 2.2 Token Acquisition

Call `POST /api/token` **before any other call**. Token is valid for **8 hours (28800 seconds)**.

**Two header methods are supported — pick one:**

**Method A — Combined (recommended, simpler):**
```
X-API-Key: {tenant-api-key}:{customer-guid}
```

**Method B — Separate headers:**
```
X-API-Key: {tenant-api-key}
X-Customer-ID: {customer-guid}
```

Header names are case-insensitive (`X-API-Key` / `X-Api-Key` / `x-api-key` all work).

### 2.3 Using the Token

For every other endpoint, include:
```
Authorization: Bearer {token}
```

### 2.4 Token Refresh Strategy

- Cache token + expiry timestamp in memory.
- Before each request, check: `if now >= expiry - 5 minutes → refresh`.
- On `401 Unauthorized` → force refresh and retry once.

---

## 3. Endpoints

All endpoints use `POST`. All return `200 OK` on success with a JSON body.

| # | Endpoint | Purpose |
|---|---|---|
| 1 | `/api/token` | Get JWT token |
| 2 | `/api/submitfordelivery` | Submit documents for mailing |
| 3 | `/api/getsubmissionstatus` | Retrieve submission status + logs |
| 4 | `/api/getproofofservice` | Download Proof of Service PDF |

---

### 3.1 `POST /api/token`

**Headers:**
```
Content-Type: application/json
X-API-Key: {tenant-api-key}:{customer-guid}
```

**Body:** `{}` (empty object)

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 28800,
  "tokenType": "Bearer"
}
```

---

### 3.2 `POST /api/submitfordelivery`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "fileNumber": "FILE-2024-001",
  "caseNumber": "CASE-2024-001",
  "postType": "Standard",
  "duplexPrint": false,
  "expressDelivery": false,
  "billingCode": "BILL-2024-001",
  "attachments": [
    {
      "fileName": "document.pdf",
      "fileContent": "base64-encoded-content"
    }
  ],
  "parties": [
    {
      "name": "John Doe",
      "companyName": "Acme Corporation",
      "phoneNumber": "555-123-4567",
      "partyRole": "Defendant",
      "addressLine1": "123 Main Street",
      "addressLine2": "Suite 100",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90001",
      "deliveryMethodName": "Mail Delivery",
      "showOnPosName": "Certified"
    }
  ]
}
```

**Success Response (200):**
```json
{
  "submissionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "submissionNumber": "SUB-2024-001234",
  "status": "Submitted"
}
```

> **Store `submissionId`** — it's required for status and POS queries.

---

### 3.3 `POST /api/getsubmissionstatus`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{ "submissionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
```

**Success Response (200):**
```json
{
  "submissionNumber": "SUB-2024-001234",
  "status": "Processing",
  "deliveryStatus": "Pending",
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "action": "Submitted",
      "message": "Document submission received"
    },
    {
      "timestamp": "2024-01-15T10:35:00Z",
      "action": "Processing",
      "message": "Document is being processed"
    }
  ]
}
```

---

### 3.4 `POST /api/getproofofservice`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{ "submissionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
```

**Success Response (200):**
```json
{
  "submissionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "submissionNumber": "SUB-2024-001234",
  "proofOfServicePdfBase64": "JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9MZW5n...",
  "fileName": "ProofOfService_SUB-2024-001234.pdf"
}
```

> Returns **404 Not Found** if the POS PDF is not yet generated. Poll status first, retrieve POS only after processing completes.

---

## 4. Field Reference

### 4.1 Submission Root Fields

| Field | Type | Required | Max Len | Notes |
|---|---|---|---|---|
| `fileNumber` | string | No | 50 | Internal file tracking |
| `caseNumber` | string | No | 50 | Case/matter number |
| `postType` | string | **Yes** | — | `"Standard"`, `"Do not include POS"`, `"EAMS POS"`, `"Detailed POS"`. Default: `"Standard"` |
| `duplexPrint` | boolean | No | — | Double-sided. Default `false` |
| `expressDelivery` | boolean | No | — | Expedited. Default `false` |
| `billingCode` | string | No | 50 | Billing reference |
| `attachments` | array | **Yes** | — | Min 1 |
| `parties` | array | **Yes** | — | Min 1 |

### 4.2 Attachment Fields

| Field | Type | Required | Max Len | Notes |
|---|---|---|---|---|
| `fileName` | string | **Yes** | 255 | Include extension (e.g., `notice.pdf`) |
| `fileContent` | string | **Yes** | — | **Pure base64. NO `data:...;base64,` prefix.** |

### 4.3 Party (Recipient) Fields

| Field | Type | Required | Max Len | Validation |
|---|---|---|---|---|
| `name` | string | **Yes** | 100 | `^[a-zA-Z\s\-']+$` — letters, spaces, hyphens, apostrophes |
| `companyName` | string | No | 200 | — |
| `phoneNumber` | string | No | 50 | `^[\d\s\-\+\(\)]{10,15}$` — 10–15 digits plus formatting |
| `partyRole` | string | No | 100 | e.g., `Defendant`, `Plaintiff` |
| `addressLine1` | string | **Yes** | 100 | `^[a-zA-Z0-9\s\-#.,]+$` |
| `addressLine2` | string | No | 100 | `^[a-zA-Z0-9\s\-#.,]*$` (allows empty) |
| `city` | string | **Yes** | 50 | `^[a-zA-Z\s\-']+$` |
| `state` | string | **Yes** | 2 | `^[a-zA-Z]{2}$` — exactly 2 letters |
| `zipCode` | string | **Yes** | 15 | `^[0-9]{5}(-[0-9]{4})?$` — 5 digits or ZIP+4 |
| `deliveryMethodName` | string | No | 50 | Default `"Mail Delivery"` |
| `showOnPosName` | string | No | 100 | Name shown on Proof of Service |

> **USPS Address Verification:** All party addresses are validated against the USPS database server-side. Invalid addresses return `400` with suggested corrections.

---

## 5. Error Handling

### 5.1 HTTP Status Codes

| Code | Meaning | Typical Causes |
|---|---|---|
| `200` | OK | Success |
| `400` | Bad Request | Missing fields, invalid format, USPS address failure, invalid base64 |
| `401` | Unauthorized | Missing/invalid credentials, expired JWT, inactive account |
| `402` | Payment Required | Insufficient account balance |
| `404` | Not Found | Unknown `submissionId`, POS not yet available |
| `422` | Unprocessable Entity | Field validation errors (regex/length) |
| `500` | Internal Server Error | Server-side issue — retry with backoff |

### 5.2 Error Response Formats

**Generic error:**
```json
{ "message": "Error description here" }
```

**Validation error (422):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 422,
  "errors": {
    "Parties[0].Name": ["Name is required"],
    "Parties[0].State": ["State must be exactly 2 characters"]
  }
}
```

**Address verification error (400):**
```json
{
  "message": "Address verification failed for one or more parties.",
  "errors": [
    {
      "partyIndex": 1,
      "partyName": "John Doe",
      "suggestions": [
        {
          "addressLine1": "123 Main St",
          "city": "Los Angeles",
          "state": "CA",
          "zipCode": "90001"
        }
      ]
    }
  ]
}
```

### 5.3 Recommended Error Handling Logic

1. On `401`: clear cached token, refresh, retry the original request **once**.
2. On `400` address errors: surface `suggestions[]` to the end user for confirmation.
3. On `422`: map `errors` dict to form field-level validation messages.
4. On `404` for POS: schedule a retry after polling status.
5. On `500`: retry with exponential backoff (3 attempts: 2s, 4s, 8s).
6. On `402`: surface a billing alert — do not retry.

---

## 6. Python Implementation Reference (FastAPI-compatible)

### 6.1 Dependencies

```bash
pip install httpx pydantic python-dotenv
```

### 6.2 Environment Variables

```env
VSENDDOCS_BASE_URL=https://api.vsenddocs.com
VSENDDOCS_TENANT_API_KEY=your-tenant-api-key
VSENDDOCS_CUSTOMER_ID=your-customer-guid
```

### 6.3 Pydantic Models

```python
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
import re


class AttachmentRequest(BaseModel):
    fileName: str = Field(..., max_length=255)
    fileContent: str  # pure base64, no data URI prefix

    @field_validator("fileContent")
    @classmethod
    def no_data_uri_prefix(cls, v: str) -> str:
        if v.startswith("data:"):
            raise ValueError("fileContent must be pure base64 without a data URI prefix")
        return v


class PartyRequest(BaseModel):
    name: str = Field(..., max_length=100, pattern=r"^[a-zA-Z\s\-']+$")
    companyName: Optional[str] = Field(None, max_length=200)
    phoneNumber: Optional[str] = Field(None, max_length=50, pattern=r"^[\d\s\-\+\(\)]{10,15}$")
    partyRole: Optional[str] = Field(None, max_length=100)
    addressLine1: str = Field(..., max_length=100, pattern=r"^[a-zA-Z0-9\s\-#.,]+$")
    addressLine2: Optional[str] = Field(None, max_length=100, pattern=r"^[a-zA-Z0-9\s\-#.,]*$")
    city: str = Field(..., max_length=50, pattern=r"^[a-zA-Z\s\-']+$")
    state: str = Field(..., max_length=2, pattern=r"^[a-zA-Z]{2}$")
    zipCode: str = Field(..., max_length=15, pattern=r"^[0-9]{5}(-[0-9]{4})?$")
    deliveryMethodName: Optional[str] = Field(None, max_length=50)
    showOnPosName: Optional[str] = Field(None, max_length=100)


class SubmissionRequest(BaseModel):
    fileNumber: Optional[str] = Field(None, max_length=50)
    caseNumber: Optional[str] = Field(None, max_length=50)
    postType: str = "Standard"  # "Standard" | "Do not include POS" | "EAMS POS" | "Detailed POS"
    duplexPrint: bool = False
    expressDelivery: bool = False
    billingCode: Optional[str] = Field(None, max_length=50)
    attachments: List[AttachmentRequest] = Field(..., min_length=1)
    parties: List[PartyRequest] = Field(..., min_length=1)


class AuthResponse(BaseModel):
    token: str
    expiresIn: int
    tokenType: str


class SubmissionResponse(BaseModel):
    submissionId: UUID
    submissionNumber: str
    status: str


class SubmissionLog(BaseModel):
    timestamp: datetime
    action: str
    message: str


class SubmissionStatusResponse(BaseModel):
    submissionNumber: str
    status: str
    deliveryStatus: str
    logs: List[SubmissionLog] = []


class ProofOfServiceResponse(BaseModel):
    submissionId: UUID
    submissionNumber: str
    proofOfServicePdfBase64: str
    fileName: str
```

### 6.4 Async Client with Auto Token Refresh

```python
import base64
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
from uuid import UUID

import httpx


class VSendDocsAPIError(Exception):
    def __init__(self, status_code: int, message: str, payload: Optional[dict] = None):
        self.status_code = status_code
        self.message = message
        self.payload = payload or {}
        super().__init__(f"[{status_code}] {message}")


class VSendDocsClient:
    def __init__(self, base_url: str, tenant_api_key: str, customer_id: str, timeout: float = 30.0):
        self._base_url = base_url.rstrip("/")
        self._tenant_api_key = tenant_api_key
        self._customer_id = customer_id
        self._token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None
        self._client = httpx.AsyncClient(timeout=timeout)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.close()

    async def close(self):
        await self._client.aclose()

    # ---------- Auth ----------

    async def _ensure_token(self) -> str:
        now = datetime.now(timezone.utc)
        if (
            not self._token
            or not self._token_expiry
            or now >= (self._token_expiry - timedelta(minutes=5))
        ):
            await self._fetch_token()
        return self._token  # type: ignore[return-value]

    async def _fetch_token(self) -> None:
        url = f"{self._base_url}/api/token"
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": f"{self._tenant_api_key}:{self._customer_id}",
        }
        resp = await self._client.post(url, headers=headers, json={})
        self._raise_for_error(resp)
        data = AuthResponse(**resp.json())
        self._token = data.token
        self._token_expiry = datetime.now(timezone.utc) + timedelta(seconds=data.expiresIn)

    async def _authed_post(self, path: str, body: dict, _retry: bool = False) -> dict:
        token = await self._ensure_token()
        url = f"{self._base_url}{path}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }
        resp = await self._client.post(url, headers=headers, json=body)

        # One-time retry on 401 with a fresh token
        if resp.status_code == 401 and not _retry:
            self._token = None
            self._token_expiry = None
            return await self._authed_post(path, body, _retry=True)

        self._raise_for_error(resp)
        return resp.json()

    @staticmethod
    def _raise_for_error(resp: httpx.Response) -> None:
        if 200 <= resp.status_code < 300:
            return
        try:
            payload = resp.json()
            message = payload.get("message") or payload.get("title") or resp.text
        except Exception:
            payload = {}
            message = resp.text
        raise VSendDocsAPIError(resp.status_code, message, payload)

    # ---------- Public Methods ----------

    async def submit_document(self, request: SubmissionRequest) -> SubmissionResponse:
        data = await self._authed_post(
            "/api/submitfordelivery",
            request.model_dump(exclude_none=True),
        )
        return SubmissionResponse(**data)

    async def get_status(self, submission_id: UUID) -> SubmissionStatusResponse:
        data = await self._authed_post(
            "/api/getsubmissionstatus",
            {"submissionId": str(submission_id)},
        )
        return SubmissionStatusResponse(**data)

    async def get_proof_of_service(self, submission_id: UUID) -> ProofOfServiceResponse:
        data = await self._authed_post(
            "/api/getproofofservice",
            {"submissionId": str(submission_id)},
        )
        return ProofOfServiceResponse(**data)

    # ---------- Helpers ----------

    @staticmethod
    def encode_file_to_base64(file_path: str | Path) -> str:
        """Encode a file to pure base64 (no data URI prefix)."""
        with open(file_path, "rb") as f:
            return base64.b64encode(f.read()).decode("ascii")

    @staticmethod
    def save_pos_pdf(response: ProofOfServiceResponse, output_dir: str | Path) -> Path:
        """Decode and save the POS PDF from a ProofOfServiceResponse."""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        out = output_dir / response.fileName
        out.write_bytes(base64.b64decode(response.proofOfServicePdfBase64))
        return out
```

### 6.5 Usage Example

```python
import asyncio
import os
from uuid import UUID

from dotenv import load_dotenv

load_dotenv()


async def main():
    async with VSendDocsClient(
        base_url=os.environ["VSENDDOCS_BASE_URL"],
        tenant_api_key=os.environ["VSENDDOCS_TENANT_API_KEY"],
        customer_id=os.environ["VSENDDOCS_CUSTOMER_ID"],
    ) as client:

        # 1. Build submission
        b64 = VSendDocsClient.encode_file_to_base64("./notice.pdf")
        request = SubmissionRequest(
            fileNumber="FILE-2024-001",
            postType="Standard",
            attachments=[AttachmentRequest(fileName="notice.pdf", fileContent=b64)],
            parties=[
                PartyRequest(
                    name="John Doe",
                    partyRole="Defendant",
                    addressLine1="123 Main Street",
                    city="Los Angeles",
                    state="CA",
                    zipCode="90001",
                    deliveryMethodName="Mail Delivery",
                )
            ],
        )

        # 2. Submit
        submission = await client.submit_document(request)
        print(f"Submitted: {submission.submissionNumber} ({submission.submissionId})")

        # 3. Poll status
        status = await client.get_status(submission.submissionId)
        print(f"Status: {status.status} / Delivery: {status.deliveryStatus}")

        # 4. Retrieve POS once ready
        try:
            pos = await client.get_proof_of_service(submission.submissionId)
            saved = VSendDocsClient.save_pos_pdf(pos, "./pos_output")
            print(f"POS saved: {saved}")
        except VSendDocsAPIError as e:
            if e.status_code == 404:
                print("POS not yet available. Poll status and retry later.")
            else:
                raise


if __name__ == "__main__":
    asyncio.run(main())
```

### 6.6 FastAPI Integration Sketch

```python
from fastapi import FastAPI, HTTPException, Depends
from functools import lru_cache

app = FastAPI()


@lru_cache
def get_client() -> VSendDocsClient:
    return VSendDocsClient(
        base_url=os.environ["VSENDDOCS_BASE_URL"],
        tenant_api_key=os.environ["VSENDDOCS_TENANT_API_KEY"],
        customer_id=os.environ["VSENDDOCS_CUSTOMER_ID"],
    )


@app.post("/api/vsenddocs/submit", response_model=SubmissionResponse)
async def submit(request: SubmissionRequest, client: VSendDocsClient = Depends(get_client)):
    try:
        return await client.submit_document(request)
    except VSendDocsAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.payload or e.message)


@app.get("/api/vsenddocs/status/{submission_id}", response_model=SubmissionStatusResponse)
async def status(submission_id: UUID, client: VSendDocsClient = Depends(get_client)):
    try:
        return await client.get_status(submission_id)
    except VSendDocsAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.payload or e.message)


@app.get("/api/vsenddocs/pos/{submission_id}", response_model=ProofOfServiceResponse)
async def pos(submission_id: UUID, client: VSendDocsClient = Depends(get_client)):
    try:
        return await client.get_proof_of_service(submission_id)
    except VSendDocsAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.payload or e.message)


@app.on_event("shutdown")
async def shutdown():
    await get_client().close()
```

---

## 7. Implementation Checklist for Cursor AI Agent

- [ ] Add env vars: `VSENDDOCS_BASE_URL`, `VSENDDOCS_TENANT_API_KEY`, `VSENDDOCS_CUSTOMER_ID`.
- [ ] Implement Pydantic models (Section 6.3) exactly as shown — regex patterns match USPS / vSendDocs rules.
- [ ] Implement `VSendDocsClient` (Section 6.4) with:
  - [ ] Token caching with 5-minute refresh buffer
  - [ ] One-time `401` retry after forced token refresh
  - [ ] `VSendDocsAPIError` with structured payload
- [ ] Strip any `data:application/pdf;base64,` prefix before sending `fileContent`.
- [ ] Implement 422 error parsing → map to user-facing form errors.
- [ ] Implement 400 address error parsing → present USPS suggestions to the user.
- [ ] Treat 404 from `/api/getproofofservice` as "not yet ready" — not a hard failure.
- [ ] Add exponential backoff for 500 errors (2s / 4s / 8s, max 3 attempts).
- [ ] Do NOT retry on 402 — surface billing issue.
- [ ] Log `submissionId` + `submissionNumber` pairs for traceability.
- [ ] Write tests mocking `httpx` responses for each error code path.

---

## 8. Quick Reference — Lifecycle Diagram

```
┌──────────────────┐
│  Get JWT Token   │  POST /api/token  (cache for 8h, refresh at 7h55m)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Submit Document  │  POST /api/submitfordelivery
│                  │  → returns submissionId + submissionNumber
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Poll Status    │  POST /api/getsubmissionstatus
│   (loop until    │  → status: Submitted → Processing → Completed
│    completed)    │  → deliveryStatus: Pending → In Transit → Delivered
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Download POS    │  POST /api/getproofofservice
│  PDF (base64)    │  → decode proofOfServicePdfBase64 → save as PDF
└──────────────────┘
```

---

**Support:** `support@vsenddocs.com`
**Docs:** `https://docs.vsenddocs.com`

---

## Stripe Environment Variables

Add these values to `.env.local` for local Stripe checkout, portal, and webhook testing:

```env
STRIPE_SECRET_KEY=sk_test_...                  # From Stripe Dashboard -> Developers -> API keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...                # From: stripe listen --forward-to localhost:3010/api/billing/stripe/webhook
STRIPE_PRICE_STARTER=price_...                 # From Stripe Dashboard -> Products -> starter plan price ID
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_ENTERPRISE=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3010
```

## Stripe Testing Checklist

**Local setup:**

1. Install Stripe CLI: https://docs.stripe.com/stripe-cli
2. Login: `stripe login` (opens browser - 2FA prompt will appear, complete it)
3. Listen for webhooks: `stripe listen --forward-to localhost:3010/api/billing/stripe/webhook`
   - Copy the `whsec_...` secret printed and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`
4. In a second terminal: `npm run dev` (or `npm run dev` inside `/frontend`)

**Test subscription checkout (happy path):**

5. Log in as a client account. Navigate to billing/upgrade.
6. Select a plan -> click Subscribe.
7. You are redirected to Stripe hosted checkout.
8. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
9. Complete checkout. You are redirected back to the app billing tab (e.g. `/customer/{clientId}/account?tab=billing&checkout=success`).
10. In the Stripe CLI terminal, confirm: `checkout.session.completed` event received and `200 OK` returned.
11. Check DB: `subscriptions` table has a new row with `stripe_subscription_id` and `status = active`.

**Test declined card:**

12. Repeat steps 5-8 with card `4000 0000 0000 0002`.
13. Stripe shows decline. User stays on checkout page. No subscription created.

**Test billing portal:**

14. After a successful subscription, call `POST /api/billing/stripe/portal`.
15. You receive a `{ url }` - open it. You can see invoices, update payment method, cancel.

**Test webhook events (using Stripe CLI trigger):**

16. Trigger: `stripe trigger customer.subscription.updated`
17. Trigger: `stripe trigger customer.subscription.deleted`
18. Confirm each event is logged in the Stripe CLI terminal with `200 OK`.

**Test wallet top-up:**

19. Call `POST /api/billing/topup` with `{ amount: 50 }`.
20. Use test card `4242 4242 4242 4242`.
21. Confirm `checkout.session.completed` with `type=topup` metadata is received.

**Troubleshooting:**

- If PowerShell says `stripe : The term 'stripe' is not recognized`:
  - Install Stripe CLI and ensure it is on your PATH, then restart the terminal.
  - Alternatively, run it via the full path to `stripe.exe`.
- If Stripe redirects to a `404` after payment:
  - Your `NEXT_PUBLIC_APP_URL` and/or the checkout `success_url` is pointing to a route that doesn’t exist (common mistake: `/dashboard?checkout=success`).
  - For this app, success/cancel should return to `/customer/{clientId}/account?tab=billing&checkout=success|cancel`.
