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

export type SecurityPrefs = {
  twoFactor: boolean;
  loginAlerts: boolean;
  sessionTimeout: string;
};

export type NotificationPrefs = {
  newMail: boolean;
  chequeReceived: boolean;
  depositComplete: boolean;
  pickupReady: boolean;
  weeklyReport: boolean;
};

export type CustomerAccountResponse = {
  profile: CustomerProfile;
  bankAccounts: BankAccountDto[];
  security: SecurityPrefs;
  notifications: NotificationPrefs;
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
  security: { twoFactor: true, loginAlerts: true, sessionTimeout: "30" },
  notifications: {
    newMail: true,
    chequeReceived: true,
    depositComplete: true,
    pickupReady: false,
    weeklyReport: true,
  },
};

const apiBase = () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function fetchCustomerAccount(companyId = "demo"): Promise<CustomerAccountResponse> {
  const url = `${apiBase()}/api/customer/account?companyId=${encodeURIComponent(companyId)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Account request failed (${res.status})`);
  }
  return res.json() as Promise<CustomerAccountResponse>;
}

export async function saveCustomerAccount(
  body: Partial<{
    profile: CustomerProfile;
    bankAccounts: BankAccountDto[];
    security: SecurityPrefs;
    notifications: NotificationPrefs;
  }>,
  companyId = "demo"
): Promise<CustomerAccountResponse> {
  const url = `${apiBase()}/api/customer/account?companyId=${encodeURIComponent(companyId)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Account save failed (${res.status})`);
  }
  return res.json() as Promise<CustomerAccountResponse>;
}
