export type SubmitPayload = {
  fileNumber?: string;
  postType: "Standard" | "Do not include POS" | "EAMS POS" | "Detailed POS";
  duplexPrint?: boolean;
  expressDelivery?: boolean;
  attachments: { fileName: string; fileContent: string }[]; // pure base64
  parties: {
    name: string;
    companyName?: string;
    phoneNumber?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string; // exactly 2 letters
    zipCode: string; // 5 digits or ZIP+4
    deliveryMethodName?: string;
  }[];
};

export type SubmitResult = {
  submissionId: string;
  submissionNumber: string;
  status: string;
};

export type StatusResult = {
  status: string;
  deliveryStatus: string;
  logs: { timestamp: string; action: string; message: string }[];
};

export type PosResult = { proofOfServicePdfBase64: string; fileName: string };

export class VSendDocsError extends Error {
  status: number;
  payload: any;

  constructor(message: string, opts: { status: number; payload?: any }) {
    super(message);
    this.name = "VSendDocsError";
    this.status = opts.status;
    this.payload = opts.payload;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowMs() {
  return Date.now();
}

function parseJsonSafe(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

type TokenResponse = { token: string; expiresIn: number; tokenType?: string };

export class VSendDocsClient {
  private baseUrl: string;
  private tenantApiKey: string;
  private customerId?: string;

  private _token: string | null = null;
  private _tokenExpiryMs: number | null = null;

  constructor(baseUrl: string, tenantApiKey: string, customerId?: string) {
    this.baseUrl = String(baseUrl || "").replace(/\/$/, "");
    this.tenantApiKey = String(tenantApiKey || "");
    this.customerId = customerId ? String(customerId) : undefined;

    if (!this.baseUrl) throw new Error("VSENDDOCS_BASE_URL is not configured.");
    if (!this.tenantApiKey) throw new Error("VSENDDOCS_TENANT_API_KEY is not configured.");
  }

  private isTokenFresh(): boolean {
    if (!this._token || !this._tokenExpiryMs) return false;
    // Refresh 5 minutes before expiry
    return nowMs() < this._tokenExpiryMs - 5 * 60_000;
  }

  private clearToken() {
    this._token = null;
    this._tokenExpiryMs = null;
  }

  async fetchToken(): Promise<string> {
    const url = `${this.baseUrl}/api/token`;
    const apiKey = this.customerId
      ? `${this.tenantApiKey}:${this.customerId}`
      : `${this.tenantApiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      const payload = parseJsonSafe(text) ?? text;
      throw new VSendDocsError("Failed to fetch vSendDocs token", {
        status: res.status,
        payload,
      });
    }

    const data = (parseJsonSafe(text) ?? {}) as Partial<TokenResponse>;
    if (!data.token || typeof data.expiresIn !== "number") {
      throw new VSendDocsError("Invalid vSendDocs token response", {
        status: 500,
        payload: data,
      });
    }

    this._token = data.token;
    this._tokenExpiryMs = nowMs() + data.expiresIn * 1000;
    return this._token;
  }

  private async ensureToken(): Promise<string> {
    if (this.isTokenFresh()) return this._token as string;
    return this.fetchToken();
  }

  private async postWithAuth<T>(
    path: string,
    body: any,
    opts?: { retry401?: boolean; attempt500?: number }
  ): Promise<T> {
    const retry401 = opts?.retry401 ?? true;
    const attempt500 = opts?.attempt500 ?? 0;

    const token = await this.ensureToken();
    const url = `${this.baseUrl}${path}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    });

    const text = await res.text();
    const payload = parseJsonSafe(text) ?? text;

    if (res.status === 401 && retry401) {
      this.clearToken();
      await this.fetchToken();
      return this.postWithAuth<T>(path, body, { retry401: false, attempt500 });
    }

    if (res.status === 500) {
      const backoff = [2000, 4000, 8000];
      if (attempt500 < backoff.length) {
        await sleep(backoff[attempt500]);
        return this.postWithAuth<T>(path, body, { retry401, attempt500: attempt500 + 1 });
      }
      throw new VSendDocsError("vSendDocs server error (500) after retries", {
        status: 500,
        payload,
      });
    }

    if (res.status === 402) {
      throw new VSendDocsError("Insufficient vSendDocs account balance", {
        status: 402,
        payload,
      });
    }

    if (!res.ok) {
      // Preserve full payload for 400/422 and all other errors so callers can surface details.
      const message =
        (payload && typeof payload === "object" && "message" in payload && (payload as any).message) ||
        (payload && typeof payload === "object" && "title" in payload && (payload as any).title) ||
        `vSendDocs request failed (${res.status})`;
      throw new VSendDocsError(String(message), { status: res.status, payload });
    }

    return (payload ?? {}) as T;
  }

  submitForDelivery(payload: SubmitPayload): Promise<SubmitResult> {
    return this.postWithAuth<SubmitResult>("/api/submitfordelivery", payload);
  }

  getStatus(submissionId: string): Promise<StatusResult> {
    return this.postWithAuth<StatusResult>("/api/getsubmissionstatus", { submissionId });
  }

  getProofOfService(submissionId: string): Promise<PosResult> {
    return this.postWithAuth<PosResult>("/api/getproofofservice", { submissionId });
  }
}

export const vSendDocsClient = new VSendDocsClient(
  process.env.VSENDDOCS_BASE_URL!,
  process.env.VSENDDOCS_TENANT_API_KEY!,
  process.env.VSENDDOCS_CUSTOMER_ID || undefined,
);

