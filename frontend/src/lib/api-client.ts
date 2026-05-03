const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("vscanmail_token") ||
    getCookieValue("sb-access-token")
  );
}

type JsonHeaders = Record<string, string>;

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: JsonHeaders = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      0,
      API_BASE
        ? `Cannot reach API at ${API_BASE}. Is the backend running?`
        : "Cannot reach API (proxy). Start the backend on port 3010 and restart the frontend dev server."
    );
  }

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({} as any));

    if (res.status === 401) {
      window.localStorage.removeItem("vscanmail_token");
      document.cookie =
        "sb-access-token=; path=/; max-age=0; samesite=lax";
      window.location.href = "/login";
    }

    throw new ApiError(
      res.status,
      body?.error || `Request failed (${res.status})`,
      body
    );
  }

  return res.json();
}

export async function apiUpload<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = getToken();

  const headers: JsonHeaders = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch {
    throw new ApiError(
      0,
      API_BASE
        ? `Cannot reach API at ${API_BASE}. Is the backend running?`
        : "Cannot reach API (proxy). Start the backend on port 3010 and restart the frontend dev server."
    );
  }

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({} as any));
    throw new ApiError(res.status, body?.error || "Upload failed", body);
  }

  return res.json();
}

