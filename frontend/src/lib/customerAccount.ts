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

export type CustomerAccountResponse = {
  profile: CustomerProfile;
  bankAccounts: BankAccountDto[];
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
    notifications: NotificationPrefs;
  }>
): Promise<CustomerAccountResponse> {
  return apiClient<CustomerAccountResponse>("/api/customer/account", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
