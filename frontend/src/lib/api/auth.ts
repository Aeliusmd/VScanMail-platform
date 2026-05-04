import { apiClient } from "../api-client";

export type UserRole = "super_admin" | "admin" | "operator" | "client";

export interface LoginResponse {
  session: {
    access_token?: string;
    accessToken?: string;
    [key: string]: any;
  };
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

  completeRegistrationCheckout: (sessionId: string) =>
    apiClient<{
      active: boolean;
      status?: string;
      paymentStatus?: string;
      error?: string;
      access_token?: string;
      user?: { id: string; email: string; role: string; clientId: string };
    }>(
      "/api/auth/registration-checkout-complete",
      {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      }
    ),

  me: () => apiClient<MeResponse>("/api/auth/me", { method: "GET", cache: "no-store" }),
};
