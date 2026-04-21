"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FALLBACK_ACCOUNT,
  fetchCustomerAccount,
  saveCustomerAccount,
} from "@/lib/customerAccount";
import { buildBillingSubscriptionState } from "@/lib/billingLocal";
import {
  FALLBACK_BILLING,
  postBillingUpgradeRequest,
  type CustomerBillingResponse,
} from "@/lib/customerBilling";
import { useOrgContext } from "../components/OrgContext";
import { billingApi, type UsageSummary } from "@/lib/api/billing";
import { bankAccountsApi, type BankAccountListItem } from "@/lib/api/bankAccounts";

type BankAccount = BankAccountListItem;

type AccountTab = "profile" | "bank-accounts" | "security" | "notifications" | "billing";

function scanUsagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

function initialsFromProfile(companyName: string, email: string): string {
  const t = companyName.trim();
  if (t.length >= 2) return t.slice(0, 2).toUpperCase();
  const e = email.split("@")[0]?.slice(0, 2) ?? "??";
  return e.toUpperCase();
}

// Plan data for upgrade modal
const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$49',
    period: '/mo',
    tagline: 'Perfect for small businesses',
    icon: 'ri-seedling-line',
    features: ['Up to 100 scans/month', 'AI mail summaries', 'Email notifications', 'Dashboard access', 'Basic support'],
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$149',
    period: '/mo',
    tagline: 'For growing companies',
    icon: 'ri-rocket-line',
    features: ['Up to 500 scans/month', 'AI mail summaries', 'Priority notifications', 'Cheque deposit service', 'Advanced dashboard', 'Priority support'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    tagline: 'For large organizations',
    icon: 'ri-building-2-line',
    features: ['Unlimited scans', 'Advanced AI features', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', '24/7 premium support'],
    popular: false,
  },
];

export default function CustomerAccountPage() {
  const org = useOrgContext();
  const companyId = org.clientId ?? "demo";

  const [activeTab, setActiveTab] = useState<AccountTab>("profile");
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState(FALLBACK_ACCOUNT.profile);
  const [profileDirty, setProfileDirty] = useState(false);

  const [newBank, setNewBank] = useState({
    bankName: "",
    nickname: "",
    accountNumber: "",
    accountType: "Checking" as "Checking" | "Savings",
    isPrimary: false,
  });
  const [bankFormError, setBankFormError] = useState("");

  const [security, setSecurity] = useState(FALLBACK_ACCOUNT.security);
  const [notifs, setNotifs] = useState(FALLBACK_ACCOUNT.notifications);

  const [billing, setBilling] = useState<CustomerBillingResponse>(() => structuredClone(FALLBACK_BILLING));
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<string | null>(null);
  const [upgradeConfirmed, setUpgradeConfirmed] = useState(false);
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);

  const loadAccount = useCallback(async () => {
    setAccountLoading(true);
    setAccountError(null);
    try {
      const data = await fetchCustomerAccount(companyId);
      setProfile((prev) => ({
        ...data.profile,
        companyName: org.companyName || data.profile.companyName,
        email: org.client?.email || data.profile.email,
      }));
      setSecurity(data.security);
      setNotifs(data.notifications);
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : "Could not load account");
      setProfile((prev) => ({
        ...(FALLBACK_ACCOUNT.profile as any),
        companyName: org.companyName || FALLBACK_ACCOUNT.profile.companyName,
        email: org.client?.email || FALLBACK_ACCOUNT.profile.email,
      }));
      setSecurity(FALLBACK_ACCOUNT.security);
      setNotifs(FALLBACK_ACCOUNT.notifications);
    }

    try {
      // Bank accounts are fetched from the secure bank accounts API (encrypted at rest server-side).
      const banks = await bankAccountsApi.list();
      setBankAccounts(banks);
    } catch (e) {
      // Don't blank the list on transient errors; keep what we have and show a lightweight error.
      console.error("Failed to load bank accounts:", e);
    } finally {
      setAccountLoading(false);
    }
  }, [companyId, org.companyName, org.client?.email]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    if (org.loading) return;
    let cancelled = false;
    (async () => {
      try {
        const u = await billingApi.getUsage();
        if (cancelled) return;
        setUsage(u);
        const totalQty = Object.values(u.breakdown || {}).reduce((sum, b) => sum + (b?.quantity || 0), 0);
        setBilling((prev) => ({
          ...prev,
          manual: { ...prev.manual, scansUsed: totalQty },
          subscription: { ...prev.subscription, scansUsed: totalQty },
        }));
      } catch (e) {
        // keep fallback billing
        console.error("Failed to load billing usage:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [org.loading]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleUpgradeConfirm = () => {
    if (!selectedUpgradePlan || !billing) return;
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedUpgradePlan);
    if (!plan) return;

    setUpgradeSubmitting(true);
    const next = buildBillingSubscriptionState(billing, plan);
    setBilling(next);

    void postBillingUpgradeRequest(selectedUpgradePlan, companyId).catch(() => { });

    setUpgradeSubmitting(false);
    setUpgradeConfirmed(true);
    window.setTimeout(() => {
      setShowUpgradeModal(false);
      setUpgradeConfirmed(false);
      setSelectedUpgradePlan(null);
      showSuccess(`Your plan is now ${plan.name}. You can change details anytime from Billing & Plan.`);
    }, 700);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const data = await saveCustomerAccount({ profile }, companyId);
      setProfile(data.profile);
      setProfileDirty(false);
      showSuccess("Profile updated successfully!");
    } catch (e) {
      showSuccess(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  function onlyDigits(s: string) {
    return String(s || "").replace(/\D/g, "");
  }

  const addBankAccount = async () => {
    setBankFormError("");
    if (!newBank.bankName || !newBank.nickname || !newBank.accountNumber) {
      setBankFormError("Please fill in all required fields.");
      return;
    }

    const acct = onlyDigits(newBank.accountNumber);
    if (acct.length < 4 || acct.length > 17) {
      setBankFormError("Account number must be 4 to 17 digits.");
      return;
    }

    setSaving(true);
    try {
      await bankAccountsApi.create({
        bankName: newBank.bankName,
        nickname: newBank.nickname,
        accountType: newBank.accountType === "Checking" ? "checking" : "savings",
        accountNumber: acct,
        isPrimary: newBank.isPrimary,
      });
      setShowAddBank(false);
      setBankAccounts(await bankAccountsApi.list());
      setNewBank({
        bankName: "",
        nickname: "",
        accountNumber: "",
        accountType: "Checking",
        isPrimary: false,
      });
      showSuccess("Bank account added successfully!");
    } catch (e) {
      setBankFormError(e instanceof Error ? e.message : "Failed to add bank account");
    } finally {
      setSaving(false);
    }
  };

  const setPrimary = async (id: string) => {
    setSaving(true);
    try {
      await bankAccountsApi.setPrimary(id);
      setBankAccounts(await bankAccountsApi.list());
      showSuccess("Primary account updated!");
    } catch (e) {
      showSuccess(e instanceof Error ? e.message : "Failed to update primary account");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async (id: string) => {
    setDeleteError(null);
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm.");
      return;
    }

    setSaving(true);
    try {
      await bankAccountsApi.remove(id, deletePassword);
      setDeleteConfirmId(null);
      setDeletePassword("");
      setBankAccounts(await bankAccountsApi.list());
      showSuccess("Bank account removed.");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to remove bank account");
    } finally {
      setSaving(false);
    }
  };

  const saveSecurityPrefs = async () => {
    setSaving(true);
    try {
      const data = await saveCustomerAccount({ security }, companyId);
      setSecurity(data.security);
      showSuccess("Security preferences saved!");
    } catch (e) {
      showSuccess(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationPrefs = async () => {
    setSaving(true);
    try {
      const data = await saveCustomerAccount({ notifications: notifs }, companyId);
      setNotifs(data.notifications);
      showSuccess("Notification preferences saved!");
    } catch (e) {
      showSuccess(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: AccountTab; label: string; icon: string }[] = [
    { key: "profile", label: "Organization Profile", icon: "ri-building-line" },
    { key: "bank-accounts", label: "Bank Accounts", icon: "ri-bank-line" },
    { key: "billing", label: "Billing & Plan", icon: "ri-price-tag-3-line" },
    { key: "security", label: "Security", icon: "ri-shield-check-line" },
    { key: "notifications", label: "Notifications", icon: "ri-notification-3-line" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your Organization profile, bank accounts, and preferences</p>
        </div>



        {successMsg && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <i className="ri-checkbox-circle-fill text-[#2F8F3A] text-xl"></i>
            <span className="text-[#2F8F3A] font-medium text-sm">{successMsg}</span>
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full shrink-0 lg:w-56">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {/* Mobile: compact row */}
              <div className="flex items-center gap-3 border-b border-gray-200 p-4 lg:hidden">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170]">
                  <span className="text-lg font-bold text-white">
                    {initialsFromProfile(profile.companyName, profile.email)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">{profile.companyName}</p>
                  <p className="truncate text-xs text-gray-500">{profile.email}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-[#2F8F3A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2F8F3A]" />
                  Active
                </span>
              </div>
              {/* Desktop: avatar block */}
              <div className="hidden border-b border-gray-200 p-6 text-center lg:block">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170]">
                  <span className="text-xl font-bold text-white">
                    {initialsFromProfile(profile.companyName, profile.email)}
                  </span>
                </div>
                <p className="truncate px-1 text-sm font-bold text-gray-900">{profile.companyName}</p>
                <p className="mt-0.5 truncate px-1 text-xs text-gray-500">{profile.email}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-[#2F8F3A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2F8F3A]" />
                  Active
                </span>
              </div>
              <nav className="flex gap-1 overflow-x-auto p-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all lg:mb-0.5 lg:w-full lg:gap-3 lg:text-left ${activeTab === t.key ? "bg-blue-50 text-[#0A3D8F]" : "text-gray-600 hover:bg-gray-100"
                      } cursor-pointer whitespace-nowrap`}
                  >
                    <i className={`${t.icon} text-base`} />
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Panel */}
          <div className="min-w-0 flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Organization Profile</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Update your organization information and contact details</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
                      <input type="text" value={profile.companyName} onChange={e => { setProfile(p => ({ ...p, companyName: e.target.value })); setProfileDirty(true); }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Contact Person</label>
                      <input type="text" value={profile.contactPerson} onChange={e => { setProfile(p => ({ ...p, contactPerson: e.target.value })); setProfileDirty(true); }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                      <input type="email" value={profile.email} onChange={e => { setProfile(p => ({ ...p, email: e.target.value })); setProfileDirty(true); }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                      <input type="tel" value={profile.phone} onChange={e => { setProfile(p => ({ ...p, phone: e.target.value })); setProfileDirty(true); }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                      <input type="text" value={profile.website} onChange={e => { setProfile(p => ({ ...p, website: e.target.value })); setProfileDirty(true); }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Business Address</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address</label>
                        <input type="text" value={profile.address} onChange={e => { setProfile(p => ({ ...p, address: e.target.value })); setProfileDirty(true); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                      </div>
                      <div className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                          <input type="text" value={profile.city} onChange={e => { setProfile(p => ({ ...p, city: e.target.value })); setProfileDirty(true); }}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                          <input type="text" value={profile.state} onChange={e => { setProfile(p => ({ ...p, state: e.target.value })); setProfileDirty(true); }}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP Code</label>
                          <input type="text" value={profile.zip} onChange={e => { setProfile(p => ({ ...p, zip: e.target.value })); setProfileDirty(true); }}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Business Details</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                        <select
                          aria-label="Industry"
                          value={profile.industry} onChange={e => { setProfile(p => ({ ...p, industry: e.target.value })); setProfileDirty(true); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30 cursor-pointer bg-white">
                          {['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Real Estate', 'Legal', 'Other'].map(i => <option key={i}>{i}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Employees</label>
                        <select
                          aria-label="Number of employees"
                          value={profile.employees} onChange={e => { setProfile(p => ({ ...p, employees: e.target.value })); setProfileDirty(true); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30 cursor-pointer bg-white">
                          {['1–10', '11–50', '51–200', '201–500', '500+'].map(e => <option key={e}>{e}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => void saveProfile()}
                      disabled={!profileDirty || saving || accountLoading}
                      className="px-6 py-2.5 bg-[#0A3D8F] text-white rounded-lg text-sm font-medium hover:bg-[#083170] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Accounts Tab */}
            {activeTab === 'bank-accounts' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="flex flex-col gap-3 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Bank Accounts</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Manage accounts for cheque deposits</p>
                    </div>
                    <button
                      onClick={() => setShowAddBank(true)}
                      className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0A3D8F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#083170] cursor-pointer whitespace-nowrap sm:w-auto"
                    >
                      <i className="ri-add-line"></i>
                      Add New Account
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {bankAccounts.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <i className="ri-bank-line text-3xl text-gray-400"></i>
                        </div>
                        <h3 className="text-gray-900 font-semibold mb-2">No bank accounts added</h3>
                        <p className="text-gray-500 text-sm mb-4">Add a bank account to receive cheque deposits</p>
                        <button onClick={() => setShowAddBank(true)} className="px-4 py-2 bg-[#0A3D8F] text-white rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap">
                          Add Bank Account
                        </button>
                      </div>
                    ) : (
                      bankAccounts.map(ba => (
                        <div key={ba.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5">
                          <div className="flex items-start gap-4 sm:contents">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-blue-50 flex items-center justify-center">
                              <i className="ri-bank-line text-xl text-[#0A3D8F]"></i>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-0.5 flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-gray-900">{ba.nickname}</h3>
                                {ba.isPrimary && (
                                  <span className="rounded-full bg-[#0A3D8F]/10 px-2 py-0.5 text-xs font-medium text-[#0A3D8F]">Primary</span>
                                )}
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ba.accountType === "checking" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-[#2F8F3A]"}`}>
                                  {ba.accountType === "checking" ? "Checking" : "Savings"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                {ba.bankName} • •••• {ba.accountLast4}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0">
                            {!ba.isPrimary && (
                              <button
                                onClick={() => setPrimary(ba.id)}
                                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirmId(ba.id)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <i className="ri-delete-bin-line text-base"></i>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <i className="ri-shield-check-line text-[#0A3D8F] mt-0.5"></i>
                  <div>
                    <p className="text-sm font-medium text-[#0A3D8F]">Your bank account information is secure</p>
                    <p className="text-xs text-blue-700 mt-0.5">Account numbers are encrypted and only the last 4 digits are displayed. Full details are never stored in plain text.</p>
                  </div>
                </div>

                {/* Add Bank Form */}
                {showAddBank && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                      <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                        <h2 className="text-lg font-bold text-gray-900">Add New Bank Account</h2>
                        <button onClick={() => { setShowAddBank(false); setBankFormError(''); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                          <i className="ri-close-line text-gray-500 text-lg"></i>
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        {bankFormError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <i className="ri-error-warning-fill text-red-500"></i>
                            <span className="text-sm text-red-700">{bankFormError}</span>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Name <span className="text-red-500">*</span></label>
                          <input type="text" value={newBank.bankName} onChange={e => setNewBank(p => ({ ...p, bankName: e.target.value }))}
                            placeholder="e.g. Chase Bank, Wells Fargo"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Nickname <span className="text-red-500">*</span></label>
                          <input type="text" value={newBank.nickname} onChange={e => setNewBank(p => ({ ...p, nickname: e.target.value }))}
                            placeholder="e.g. Acme Corp Operating"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Type <span className="text-red-500">*</span></label>
                          <div className="flex gap-3">
                            {(['Checking', 'Savings'] as const).map(t => (
                              <label key={t} className={`flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${newBank.accountType === t ? 'border-[#0A3D8F] bg-blue-50' : 'border-gray-200'}`}>
                                <input type="radio" value={t} checked={newBank.accountType === t} onChange={() => setNewBank(p => ({ ...p, accountType: t }))} className="text-[#0A3D8F]" />
                                <span className="text-sm font-medium text-gray-700">{t}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number <span className="text-red-500">*</span></label>
                          <input type="text" inputMode="numeric" autoComplete="off" value={newBank.accountNumber} onChange={e => setNewBank(p => ({ ...p, accountNumber: e.target.value }))}
                            placeholder="Enter account number"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                          <p className="mt-1 text-xs text-gray-400">Between 4 and 17 digits.</p>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={newBank.isPrimary} onChange={e => setNewBank(p => ({ ...p, isPrimary: e.target.checked }))} className="w-4 h-4 text-[#0A3D8F] rounded" />
                          <span className="text-sm text-gray-700">Set as primary account for deposits</span>
                        </label>
                        <div className="flex gap-3 pt-2">
                          <button onClick={() => { setShowAddBank(false); setBankFormError(''); }} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                            Cancel
                          </button>
                          <button onClick={addBankAccount} className="flex-1 py-3 bg-[#0A3D8F] text-white rounded-xl text-sm font-medium hover:bg-[#083170] cursor-pointer whitespace-nowrap">
                            Add Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Confirm */}
                {deleteConfirmId && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-delete-bin-line text-red-500 text-xl"></i>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Remove Bank Account?</h3>
                      <p className="text-sm text-gray-500 text-center mb-4">For security, please confirm with your password.</p>
                      {deleteError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                          <i className="ri-error-warning-fill text-red-500"></i>
                          <span className="text-sm text-red-700">{deleteError}</span>
                        </div>
                      )}
                      <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setDeleteConfirmId(null);
                            setDeletePassword("");
                            setDeleteError(null);
                          }}
                          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 cursor-pointer whitespace-nowrap"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteAccount(deleteConfirmId)}
                          disabled={saving}
                          className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {saving ? "Removing…" : "Remove"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Manage your account security and authentication</p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Change Password</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                        <input type="password" placeholder="Enter current password"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                        <input type="password" placeholder="Enter new password"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                        <input type="password" placeholder="Re-enter new password"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                      </div>
                      <button className="px-4 py-2.5 bg-[#0A3D8F] text-white rounded-lg text-sm font-medium hover:bg-[#083170] cursor-pointer whitespace-nowrap mt-1">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700">Security Options</h3>
                    {[
                      { key: 'twoFactor' as const, label: 'Two-Factor Authentication', desc: 'Require a verification code on login' },
                      { key: 'loginAlerts' as const, label: 'Login Alerts', desc: 'Get notified of new sign-ins to your account' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </div>
                        <button
                          onClick={() => setSecurity(p => ({ ...p, [key]: !p[key] }))}
                          className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${security[key] ? 'bg-[#0A3D8F]' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${security[key] ? 'left-6.5 translate-x-0.5' : 'left-0.5'}`}></span>
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Session Timeout</p>
                        <p className="text-xs text-gray-500 mt-0.5">Auto logout after inactivity</p>
                      </div>
                      <select
                        aria-label="Session timeout duration"
                        value={security.sessionTimeout} onChange={e => setSecurity(p => ({ ...p, sessionTimeout: e.target.value }))}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none cursor-pointer">
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => void saveSecurityPrefs()}
                        disabled={saving || accountLoading}
                        className="px-6 py-2.5 bg-[#0A3D8F] text-white rounded-lg text-sm font-medium hover:bg-[#083170] cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving…" : "Save security settings"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Choose what events trigger email notifications</p>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    { key: 'newMail' as const, label: 'New Mail Received', desc: 'When a new mail arrives for your company' },
                    { key: 'chequeReceived' as const, label: 'New Cheque Received', desc: 'When a new cheque is scanned and ready for action' },
                    { key: 'depositComplete' as const, label: 'Deposit Completed', desc: 'When a cheque has been deposited to your account' },
                    { key: 'pickupReady' as const, label: 'Pickup Ready', desc: 'When a pickup request is ready for collection' },
                    { key: 'weeklyReport' as const, label: 'Weekly Summary Report', desc: 'A weekly digest of all mail and cheque activity' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifs(p => ({ ...p, [key]: !p[key] }))}
                        className={`relative h-6 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${notifs[key] ? "bg-[#0A3D8F]" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${notifs[key] ? 'left-6' : 'left-0.5'}`}></span>
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => void saveNotificationPrefs()}
                      disabled={saving || accountLoading}
                      className="px-6 py-2.5 bg-[#0A3D8F] text-white rounded-lg text-sm font-medium hover:bg-[#083170] cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving…" : "Save Preferences"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing & Plan Tab — defaults to manual; subscription is session-only until refresh */}
            {activeTab === "billing" && (
              <div className="space-y-5">
                {billing.planType === "manual" ? (
                  <>
                    <div className="rounded-xl border border-gray-200 bg-white">
                      <div className="flex flex-col gap-3 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Billing &amp; Plan</h2>
                          <p className="mt-0.5 text-sm text-gray-500">Your current plan and usage details</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                          <i className="ri-file-text-line"></i>
                          Manual Plan
                        </span>
                      </div>

                      <div className="p-6">
                        <div className="mb-5 rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-gray-100 p-5">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                              <i className="ri-file-list-3-line text-xl text-amber-600"></i>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900">{billing.manual.planName}</h3>
                                <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-[#2F8F3A]">
                                  {billing.manual.status}
                                </span>
                              </div>
                              <p className="mb-3 text-sm text-gray-500">{billing.manual.notes}</p>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border border-gray-200 bg-white p-3">
                                  <p className="mb-0.5 text-xs text-gray-400">Start Date</p>
                                  <p className="text-sm font-semibold text-gray-800">{billing.manual.startDate}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-white p-3">
                                  <p className="mb-0.5 text-xs text-gray-400">Next Renewal</p>
                                  <p className="text-sm font-semibold text-gray-800">{billing.manual.renewalDate}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-white p-3">
                                  <p className="mb-0.5 text-xs text-gray-400">Assigned Admin</p>
                                  <p className="text-sm font-semibold text-gray-800">{billing.manual.assignedAdmin}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>



                      </div>
                    </div>

                    <div className="rounded-xl bg-gradient-to-r from-[#0A3D8F] to-[#083170] p-6 text-white">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
                            <i className="ri-rocket-line text-xl text-white"></i>
                          </div>
                          <div>
                            <h3 className="mb-1 text-base font-bold">Switch to a Subscription Plan</h3>
                            <p className="text-sm text-white/75">
                              Get predictable pricing, more scans, and premium features. Subscription plans start at
                              $49/mo.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70">
                              <span className="flex items-center gap-1">
                                <i className="ri-check-line"></i> Cancel anytime
                              </span>
                              <span className="flex items-center gap-1">
                                <i className="ri-check-line"></i> No setup fees
                              </span>
                              <span className="flex items-center gap-1">
                                <i className="ri-check-line"></i> Instant activation
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowUpgradeModal(true)}
                          className="flex-shrink-0 cursor-pointer whitespace-nowrap rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#0A3D8F] transition-colors hover:bg-gray-100"
                        >
                          View Plans
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Billing &amp; Plan</h2>
                        <p className="mt-0.5 text-sm text-gray-500">Your subscription details and usage</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#0A3D8F]/20 bg-[#0A3D8F]/10 px-3 py-1.5 text-xs font-semibold text-[#0A3D8F]">
                        <i className="ri-rocket-line"></i>
                        {billing.subscription.planLabel}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="mb-5 rounded-xl border border-[#0A3D8F]/15 bg-gradient-to-br from-[#0A3D8F]/5 to-[#083170]/5 p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-base font-bold text-gray-900">{billing.subscription.titleLine}</h3>
                            <p className="mt-0.5 text-sm text-gray-500">
                              Next billing date: {billing.subscription.nextBillingDate}
                            </p>
                          </div>
                          <Link
                            href="/customer/select-plan"
                            className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            Manage Subscription
                          </Link>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {(
                            [
                              {
                                label: "Scans Used",
                                value: `${billing.subscription.scansUsed} / ${billing.subscription.scansLimit}`,
                                icon: "ri-scan-2-line",
                                color: "text-[#0A3D8F]",
                                bg: "bg-[#0A3D8F]/10",
                              },
                              {
                                label: "Mails Received",
                                value: String(billing.subscription.mailsReceived),
                                icon: "ri-mail-line",
                                color: "text-[#2F8F3A]",
                                bg: "bg-green-50",
                              },
                              {
                                label: "Cheques",
                                value: String(billing.subscription.chequesProcessed),
                                icon: "ri-bank-card-line",
                                color: "text-amber-600",
                                bg: "bg-amber-50",
                              },
                            ] as const
                          ).map((s) => (
                            <div
                              key={s.label}
                              className="rounded-lg border border-gray-200 bg-white p-3 text-center"
                            >
                              <div
                                className={`mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full ${s.bg}`}
                              >
                                <i className={`${s.icon} ${s.color} text-sm`}></i>
                              </div>
                              <p className="text-sm font-bold text-gray-900">{s.value}</p>
                              <p className="text-xs text-gray-400">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <i className="ri-information-line shrink-0 text-gray-400"></i>
                        <p className="text-sm text-gray-500">
                          To cancel or change your plan, please contact your account manager or reach out to support.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upgrade Plan Modal */}
            {showUpgradeModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Choose a Subscription Plan</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Select the plan that best fits your business needs</p>
                    </div>
                    <button
                      onClick={() => { setShowUpgradeModal(false); setSelectedUpgradePlan(null); setUpgradeConfirmed(false); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <i className="ri-close-line text-gray-500 text-lg"></i>
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {SUBSCRIPTION_PLANS.map(plan => {
                        const isSelected = selectedUpgradePlan === plan.id;
                        const isFeatured = plan.popular;
                        return (
                          <div
                            key={plan.id}
                            onClick={() => setSelectedUpgradePlan(plan.id)}
                            className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all ${isSelected
                                ? 'border-[#0A3D8F] bg-[#0A3D8F]/5'
                                : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            {isFeatured && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#0A3D8F] text-white text-xs font-bold rounded-full whitespace-nowrap">
                                Most Popular
                              </div>
                            )}
                            <div className="flex items-center justify-between mb-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#0A3D8F]' : 'bg-gray-100'}`}>
                                <i className={`${plan.icon} text-base ${isSelected ? 'text-white' : 'text-gray-500'}`}></i>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 bg-[#0A3D8F] rounded-full flex items-center justify-center">
                                  <i className="ri-check-line text-white text-xs"></i>
                                </div>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 mb-0.5">{plan.name}</h3>
                            <p className="text-xs text-gray-400 mb-3">{plan.tagline}</p>
                            <div className="mb-4">
                              <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                              {plan.period && <span className="text-xs text-gray-400 ml-1">{plan.period}</span>}
                            </div>
                            <ul className="space-y-1.5">
                              {plan.features.map(f => (
                                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                                  <i className="ri-check-line text-[#2F8F3A] mt-0.5 flex-shrink-0"></i>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>

                    {selectedUpgradePlan && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                        <i className="ri-information-line text-amber-600 mt-0.5"></i>
                        <div>
                          <p className="text-sm font-medium text-amber-800">Switching from Manual Plan</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Your current manual plan will remain active until the end of your billing period (
                            {billing?.manual?.renewalDate ?? "see renewal date above"}). The new subscription will
                            activate after confirmation.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => { setShowUpgradeModal(false); setSelectedUpgradePlan(null); }}
                        className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleUpgradeConfirm()}
                        disabled={!selectedUpgradePlan || upgradeConfirmed || upgradeSubmitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A3D8F] py-3 text-sm font-bold text-white transition-all hover:bg-[#083170] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer whitespace-nowrap"
                      >
                        {upgradeConfirmed ? (
                          <>
                            <i className="ri-checkbox-circle-fill text-green-300"></i>
                            Request Submitted!
                          </>
                        ) : upgradeSubmitting ? (
                          <>Submitting…</>
                        ) : (
                          <>
                            <i className="ri-rocket-line"></i>
                            Confirm Upgrade
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}