export const TOKEN_COOKIE_KEY = "sb-access-token";

export async function setSessionToken(_token: string) {
  throw new Error("Session tokens are set by the server in HttpOnly cookies.");
}

export async function clearSessionToken() {
  if (typeof window === "undefined") return;
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
}

export function getSessionToken(): string | null {
  return null;
}

