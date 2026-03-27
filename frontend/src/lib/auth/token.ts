export const TOKEN_LOCAL_KEY = "vscanmail_token";
export const TOKEN_COOKIE_KEY = "sb-access-token";

export function setSessionToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_LOCAL_KEY, token);
  // Used by Next.js middleware for route protection.
  document.cookie = `${TOKEN_COOKIE_KEY}=${encodeURIComponent(
    token
  )}; path=/; max-age=604800; samesite=lax`;
}

export function clearSessionToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_LOCAL_KEY);
  document.cookie = `${TOKEN_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_LOCAL_KEY);
}

