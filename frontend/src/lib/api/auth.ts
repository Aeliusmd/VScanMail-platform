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
    apiClient<{ verified: boolean }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  me: () => apiClient<MeResponse>("/api/auth/me", { method: "GET", cache: "no-store" }),
};
