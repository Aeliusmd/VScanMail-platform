import { apiClient } from "../api-client";

export interface LoginResponse {
  session: {
    access_token?: string;
    accessToken?: string;
    [key: string]: any;
  };
  user: {
    id: string;
    email: string;
    role: "super_admin" | "admin" | "client";
    clientId?: string;
  };
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

  me: () => apiClient<any>("/api/auth/me", { method: "GET" }),
};
