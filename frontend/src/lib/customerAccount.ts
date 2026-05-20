import { apiClient } from "./api-client";

export type CustomerProfile = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  industry: string;
  employees: string;
};

export type BankAccountDto = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: "Checking" | "Savings";
  isPrimary: boolean;
  addedDate: string;
  lastUsed: string;
  bankLogo: string;
};

export type NotificationPrefs = {
  newMail: boolean;
  chequeReceived: boolean;
  depositComplete: boolean;
  pickupReady: boolean;
};

export type SecurityPrefs = {
  twoFactor: boolean;
  mfaEnabledAt: string | null;
  loginAlerts: boolean;
  sessionTimeout: string;
};

export type CustomerAccountResponse = {
  profile: CustomerProfile;
  bankAccounts: BankAccountDto[];
  security: SecurityPrefs;
  notifications: NotificationPrefs;
  /** Same-origin path e.g. `/uploads/avatars/...` from `users.avatar_url` */
  avatarUrl?: string;
};

/** Used when the API is offline so the form still renders. */
export const FALLBACK_ACCOUNT: CustomerAccountResponse = {
  profile: {
    companyName: "Acme Corporation",
    contactPerson: "James Mitchell",
    email: "james@acmecorp.com",
    phone: "+1 (512) 555-0192",
    address: "450 Business Park Drive",
    city: "Austin",
    state: "TX",
    zip: "78701",
    website: "www.acmecorp.com",
    industry: "Technology",
    employees: "51–200",
  },
  bankAccounts: [],
  security: {
    twoFactor: false,
    mfaEnabledAt: null,
    loginAlerts: true,
    sessionTimeout: "30",
  },
  notifications: {
    newMail: true,
    chequeReceived: true,
    depositComplete: true,
    pickupReady: false,
  },
};

export async function fetchCustomerAccount(): Promise<CustomerAccountResponse> {
  return apiClient<CustomerAccountResponse>("/api/customer/account", { method: "GET" });
}

export async function saveCustomerAccount(
  body: Partial<{
    profile: CustomerProfile;
    bankAccounts: BankAccountDto[];
    security: Partial<SecurityPrefs>;
    notifications: NotificationPrefs;
  }>
): Promise<CustomerAccountResponse> {
  return apiClient<CustomerAccountResponse>("/api/customer/account", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function verifyEmailChangeAuthenticator(totpCode: string): Promise<{ emailChangeToken: string }> {
  return apiClient<{ emailChangeToken: string }>("/api/profile/email-change/verify-authenticator", {
    method: "POST",
    body: JSON.stringify({ totpCode }),
  });
}

export async function sendEmailChangeOtp(emailChangeToken: string, email: string): Promise<{ ok: true }> {
  return apiClient<{ ok: true }>("/api/profile/email-change/send-otp", {
    method: "POST",
    body: JSON.stringify({ emailChangeToken, email }),
  });
}

export async function confirmEmailChange(
  emailChangeToken: string,
  email: string,
  otp: string
): Promise<{ ok: true; email: string }> {
  return apiClient<{ ok: true; email: string }>("/api/profile/email-change/confirm", {
    method: "POST",
    body: JSON.stringify({ emailChangeToken, email, otp }),
  });
}
