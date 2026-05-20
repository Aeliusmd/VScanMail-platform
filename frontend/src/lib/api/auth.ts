import { apiClient } from "../api-client";

export type UserRole = "super_admin" | "admin" | "operator" | "client";

export interface LoginResponse {
  requiresMfa?: boolean;
  tempToken?: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    clientId?: string;
  };
}

export interface AuthenticatedLoginResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    clientId?: string;
  };
}

export interface ClientInfo {
  id: string;
  client_code: string;
  table_name: string;
  company_name: string;
  registration_no: string | null;
  industry: string;
  email: string;
  phone: string;
  address_json: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  client_type: "subscription" | "manual";
  status: "active" | "suspended" | "pending" | "inactive";
  two_fa_enabled: boolean;
  two_fa_secret: string | null;
  added_by: string | null;
  notes: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeResponse {
  user: { id: string; email: string };
  role: UserRole;
  clientId: string | null;
  client: ClientInfo | null;
}

export const authApi = {
  login: (email: string, password: string, totpCode?: string) =>
    apiClient<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, totpCode }),
    }),

  verifyMfa: (tempToken: string, totpCode: string) =>
    apiClient<AuthenticatedLoginResponse>("/api/auth/verify-mfa", {
      method: "POST",
      redirectOnUnauthorized: false,
      body: JSON.stringify({ tempToken, totpCode }),
    }),

  register: (data: any) =>
    apiClient<{ clientId: string; clientCode: string }>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  verifyEmail: (email: string, otp: string) =>
    apiClient<{ verified: boolean; clientId: string | null }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  registrationStatus: (email: string) =>
    apiClient<{ emailVerified: boolean; clientPending: boolean }>(
      `/api/auth/registration-status?email=${encodeURIComponent(email)}`,
      { method: "GET" }
    ),

  registrationPlans: () =>
    apiClient<
      Array<{
        id: string;
        name: string;
        price: number;
        max_companies: number;
        max_scans: number;
        storage: string;
        ai_magic?: string | null;
        cheque_handling?: string | null;
        badge?: string | null;
        badge_color?: string | null;
        features: string[];
      }>
    >("/api/auth/registration-plans", { method: "GET", cache: "no-store" }),

  registrationCheckout: (email: string, planId: string) =>
    apiClient<{ url: string }>("/api/auth/registration-checkout", {
      method: "POST",
      body: JSON.stringify({ email, planId }),
    }),

  completeRegistrationCheckout: (sessionId: string, email: string) =>
    apiClient<{
      active: boolean;
      status?: string;
      paymentStatus?: string;
      error?: string;
      user?: { id: string; email: string; role: string; clientId: string };
      requiresLogin?: boolean;
      autoLoggedIn?: boolean;
    }>(
      "/api/auth/registration-checkout-complete",
      {
        method: "POST",
        body: JSON.stringify({ sessionId, email }),
      }
    ),

  me: () => apiClient<MeResponse>("/api/auth/me", { method: "GET", cache: "no-store" }),

  forgotPassword: (email: string) =>
    apiClient<{ ok: true }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    apiClient<{ ok: true }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    }),
  getSetup2FA: () => apiClient<{ qrCode: string; secret: string }>("/api/auth/setup-2fa", { method: "GET", cache: "no-store" }),
  confirm2FA: (totpCode: string) => apiClient<{ verified: boolean }>("/api/auth/setup-2fa", {
    method: "POST",
    body: JSON.stringify({ totpCode }),
  }),
  sendBackupOTP: (backupEmail: string) => apiClient<{ success: boolean }>("/api/auth/send-backup-otp", {
    method: "POST",
    body: JSON.stringify({ backupEmail }),
  }),
  verifyBackupOTP: (otp: string) => apiClient<{ success: boolean; codes: string[] }>("/api/auth/verify-backup-otp", {
    method: "POST",
    body: JSON.stringify({ otp }),
  }),
  skipBackupEmail: () => apiClient<{ success: boolean; codes: string[] }>("/api/auth/skip-backup-email", {
    method: "POST",
  }),
  sendRecoveryOTP: (email: string) => apiClient<{ success: boolean }>("/api/auth/login/recover-send-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  }),
  recoverAccount: (email: string, type: "email" | "code", code: string) => apiClient<{ success: boolean }>("/api/auth/login/recover", {
    method: "POST",
    body: JSON.stringify({ email, type, code }),
  }),
};
