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

type JsonHeaders = Record<string, string>;

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: JsonHeaders = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => {
      headers[key] = value;
    });
  }

  const url = `${API_BASE}${endpoint}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
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

    if (res.status === 401 && endpoint !== "/api/auth/login") {
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
  const headers: JsonHeaders = {};

  const url = `${API_BASE}${endpoint}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
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
