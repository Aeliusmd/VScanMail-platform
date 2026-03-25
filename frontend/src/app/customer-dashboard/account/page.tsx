"use client";

import Link from "next/link";
import { useState } from "react";

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'Checking' | 'Savings';
  isPrimary: boolean;
  addedDate: string;
  lastUsed: string;
  bankLogo: string;
}

const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'ba1', bankName: 'Bank of Commerce', accountName: 'Acme Corp Operating', accountNumber: '****4521',
    routingNumber: '****1234', accountType: 'Checking', isPrimary: true, addedDate: 'Mar 12, 2023', lastUsed: 'Jan 22, 2024',
    bankLogo: 'https://readdy.ai/api/search-image?query=modern%20bank%20logo%20icon%20professional%20financial%20institution%20blue%20corporate%20minimal%20design%20simple%20clean%20circle%20emblem&width=40&height=40&seq=bl1&orientation=squarish',
  },
  {
    id: 'ba2', bankName: 'First National Bank', accountName: 'Acme Corp Savings', accountNumber: '****8834',
    routingNumber: '****5678', accountType: 'Savings', isPrimary: false, addedDate: 'Jun 5, 2023', lastUsed: 'Dec 10, 2023',
    bankLogo: 'https://readdy.ai/api/search-image?query=bank%20logo%20icon%20professional%20financial%20symbol%20green%20modern%20minimal%20clean%20design%20simple%20emblem%20corporate&width=40&height=40&seq=bl2&orientation=squarish',
  },
];

type AccountTab = 'profile' | 'bank-accounts' | 'security' | 'notifications';

export default function CustomerAccountPage() {
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);
  const [showAddBank, setShowAddBank] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Profile state
  const [profile, setProfile] = useState({
    companyName: 'Acme Corporation', contactPerson: 'James Mitchell', email: 'james@acmecorp.com',
    phone: '+1 (512) 555-0192', address: '450 Business Park Drive', city: 'Austin', state: 'TX', zip: '78701',
    website: 'www.acmecorp.com', industry: 'Technology', employees: '51–200',
  });
  const [profileDirty, setProfileDirty] = useState(false);

  // New bank account form
  const [newBank, setNewBank] = useState({
    bankName: '', accountName: '', accountNumber: '', confirmAccountNumber: '',
    routingNumber: '', accountType: 'Checking' as 'Checking' | 'Savings', isPrimary: false,
  });
  const [bankFormError, setBankFormError] = useState('');

  // Security toggles
  const [security, setSecurity] = useState({ twoFactor: true, loginAlerts: true, sessionTimeout: '30' });
  // Notification toggles
  const [notifs, setNotifs] = useState({ newMail: true, chequeReceived: true, depositComplete: true, pickupReady: false, weeklyReport: true });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const saveProfile = () => {
    setProfileDirty(false);
    showSuccess('Profile updated successfully!');
  };

  const addBankAccount = () => {
    setBankFormError('');
    if (!newBank.bankName || !newBank.accountName || !newBank.accountNumber || !newBank.routingNumber) {
      setBankFormError('Please fill in all required fields.');
      return;
    }
    if (newBank.accountNumber !== newBank.confirmAccountNumber) {
      setBankFormError('Account numbers do not match.');
      return;
    }
    const masked = '****' + newBank.accountNumber.slice(-4);
    const routingMasked = '****' + newBank.routingNumber.slice(-4);
    const id = 'ba' + Date.now();
    const newAcc: BankAccount = {
      id, bankName: newBank.bankName, accountName: newBank.accountName,
      accountNumber: masked, routingNumber: routingMasked,
      accountType: newBank.accountType, isPrimary: newBank.isPrimary || bankAccounts.length === 0,
      addedDate: 'Jan 22, 2024', lastUsed: '—',
      bankLogo: 'https://readdy.ai/api/search-image?query=bank%20institution%20logo%20icon%20modern%20financial%20corporate%20minimal%20clean%20design%20emblem%20simple%20professional&width=40&height=40&seq=bl3&orientation=squarish',
    };
    setBankAccounts(prev => {
      const updated = newBank.isPrimary ? prev.map(b => ({ ...b, isPrimary: false })) : prev;
      return [...updated, newAcc];
    });
    setNewBank({ bankName: '', accountName: '', accountNumber: '', confirmAccountNumber: '', routingNumber: '', accountType: 'Checking', isPrimary: false });
    setShowAddBank(false);
    showSuccess('Bank account added successfully!');
  };

  const setPrimary = (id: string) => {
    setBankAccounts(prev => prev.map(b => ({ ...b, isPrimary: b.id === id })));
    showSuccess('Primary account updated!');
  };

  const deleteAccount = (id: string) => {
    setBankAccounts(prev => prev.filter(b => b.id !== id));
    setDeleteConfirmId(null);
    showSuccess('Bank account removed.');
  };

  const tabs: { key: AccountTab; label: string; icon: string }[] = [
    { key: 'profile', label: 'Company Profile', icon: 'ri-building-line' },
    { key: 'bank-accounts', label: 'Bank Accounts', icon: 'ri-bank-line' },
    { key: 'security', label: 'Security', icon: 'ri-shield-check-line' },
    { key: 'notifications', label: 'Notifications', icon: 'ri-notification-3-line' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Account Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your company profile, bank accounts, and preferences
            </p>
          </div>
         
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
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Account Avatar */}
              <div className="p-4 border-b border-gray-200 text-center sm:p-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0A3D8F] to-[#083170] flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl font-bold">AC</span>
                </div>
                <p className="text-sm font-bold text-gray-900">Acme Corporation</p>
                <p className="text-xs text-gray-500 mt-0.5">acme@company.com</p>
                <span className="inline-flex items-center gap-1 mt-2 text-xs bg-green-50 text-[#2F8F3A] px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#2F8F3A] rounded-full"></span> Active
                </span>
              </div>
              <nav className="flex flex-row gap-1 overflow-x-auto p-2 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-2 [&::-webkit-scrollbar]:hidden">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all cursor-pointer whitespace-nowrap lg:mb-0.5 lg:w-full ${
                      activeTab === t.key ? "bg-blue-50 text-[#0A3D8F]" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <i className={`${t.icon} text-base shrink-0`}></i>
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Panel */}
          <div className="flex-1 min-w-0">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="border-b border-gray-200 p-4 sm:p-6">
                  <h2 className="text-lg font-bold text-gray-900">Company Profile</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Update your company information and contact details</p>
                </div>
                <div className="space-y-5 p-4 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                      <input type="text" value={profile.companyName} onChange={e => { setProfile(p => ({...p, companyName: e.target.value})); setProfileDirty(true); }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Contact Person</label>
                      <input type="text" value={profile.contactPerson} onChange={e => { setProfile(p => ({...p, contactPerson: e.target.value})); setProfileDirty(true); }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                      <input type="email" value={profile.email} onChange={e => { setProfile(p => ({...p, email: e.target.value})); setProfileDirty(true); }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                      <input type="tel" value={profile.phone} onChange={e => { setProfile(p => ({...p, phone: e.target.value})); setProfileDirty(true); }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                      <input type="text" value={profile.website} onChange={e => { setProfile(p => ({...p, website: e.target.value})); setProfileDirty(true); }}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Business Address</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address</label>
                        <input type="text" value={profile.address} onChange={e => { setProfile(p => ({...p, address: e.target.value})); setProfileDirty(true); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                      </div>
                      <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                        <input type="text" value={profile.city} onChange={e => { setProfile(p => ({...p, city: e.target.value})); setProfileDirty(true); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:col-span-2 md:col-span-1">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                          <input type="text" value={profile.state} onChange={e => { setProfile(p => ({...p, state: e.target.value})); setProfileDirty(true); }}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP Code</label>
                          <input type="text" value={profile.zip} onChange={e => { setProfile(p => ({...p, zip: e.target.value})); setProfileDirty(true); }}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Business Details</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="profile-industry" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Industry
                        </label>
                        <select id="profile-industry" value={profile.industry} onChange={e => { setProfile(p => ({...p, industry: e.target.value})); setProfileDirty(true); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30 cursor-pointer bg-white">
                          {['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Real Estate', 'Legal', 'Other'].map(i => <option key={i}>{i}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="profile-employees" className="block text-sm font-medium text-gray-700 mb-1.5">
                          Number of Employees
                        </label>
                        <select id="profile-employees" value={profile.employees} onChange={e => { setProfile(p => ({...p, employees: e.target.value})); setProfileDirty(true); }}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30 cursor-pointer bg-white">
                          {['1–10', '11–50', '51–200', '201–500', '500+'].map(e => <option key={e}>{e}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-stretch pt-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={!profileDirty}
                      className="w-full px-6 py-2.5 bg-[#0A3D8F] text-white rounded-lg text-sm font-medium hover:bg-[#083170] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer sm:w-auto"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Accounts Tab */}
            {activeTab === 'bank-accounts' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Bank Accounts</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Manage accounts for cheque deposits</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddBank(true)}
                      className="flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-[#0A3D8F] text-white rounded-lg text-sm font-medium hover:bg-[#083170] transition-colors cursor-pointer sm:w-auto"
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
                        <div key={ba.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                          <div className="flex items-start gap-4 sm:contents">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                              <img src={ba.bankLogo} alt={ba.bankName} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-0.5 flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-gray-900">{ba.accountName}</h3>
                                {ba.isPrimary && (
                                  <span className="text-xs bg-[#0A3D8F]/10 text-[#0A3D8F] px-2 py-0.5 rounded-full font-medium">Primary</span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ba.accountType === 'Checking' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-[#2F8F3A]'}`}>
                                  {ba.accountType}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 break-words">{ba.bankName} • {ba.accountNumber}</p>
                              <p className="text-xs text-gray-400 mt-0.5 break-words">Routing: {ba.routingNumber} • Added {ba.addedDate} • Last used {ba.lastUsed}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0 sm:flex-shrink-0">
                            {!ba.isPrimary && (
                              <button
                                type="button"
                                onClick={() => setPrimary(ba.id)}
                                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              type="button"
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

                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
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
                          <input type="text" value={newBank.bankName} onChange={e => setNewBank(p => ({...p, bankName: e.target.value}))}
                            placeholder="e.g. Chase Bank, Wells Fargo"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Nickname <span className="text-red-500">*</span></label>
                          <input type="text" value={newBank.accountName} onChange={e => setNewBank(p => ({...p, accountName: e.target.value}))}
                            placeholder="e.g. Acme Corp Operating"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Type <span className="text-red-500">*</span></label>
                          <div className="flex gap-3">
                            {(['Checking', 'Savings'] as const).map(t => (
                              <label key={t} className={`flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${newBank.accountType === t ? 'border-[#0A3D8F] bg-blue-50' : 'border-gray-200'}`}>
                                <input type="radio" value={t} checked={newBank.accountType === t} onChange={() => setNewBank(p => ({...p, accountType: t}))} className="text-[#0A3D8F]" />
                                <span className="text-sm font-medium text-gray-700">{t}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number <span className="text-red-500">*</span></label>
                          <input type="password" value={newBank.accountNumber} onChange={e => setNewBank(p => ({...p, accountNumber: e.target.value}))}
                            placeholder="Enter account number"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Account Number <span className="text-red-500">*</span></label>
                          <input type="password" value={newBank.confirmAccountNumber} onChange={e => setNewBank(p => ({...p, confirmAccountNumber: e.target.value}))}
                            placeholder="Re-enter account number"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Routing Number <span className="text-red-500">*</span></label>
                          <input type="text" value={newBank.routingNumber} onChange={e => setNewBank(p => ({...p, routingNumber: e.target.value}))}
                            placeholder="9-digit routing number"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D8F]/30" />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={newBank.isPrimary} onChange={e => setNewBank(p => ({...p, isPrimary: e.target.checked}))} className="w-4 h-4 text-[#0A3D8F] rounded" />
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
                      <p className="text-sm text-gray-500 text-center mb-6">This account will be removed from your profile. This action cannot be undone.</p>
                      <div className="flex gap-3">
                        <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 cursor-pointer whitespace-nowrap">
                          Cancel
                        </button>
                        <button onClick={() => deleteAccount(deleteConfirmId)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 cursor-pointer whitespace-nowrap">
                          Remove
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
                <div className="border-b border-gray-200 p-4 sm:p-6">
                  <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Manage your account security and authentication</p>
                </div>
                <div className="space-y-6 p-4 sm:p-6">
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
                      <div key={key} className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSecurity(p => ({...p, [key]: !p[key]}))}
                          className={`relative h-6 w-12 shrink-0 self-end rounded-full transition-colors cursor-pointer sm:self-auto ${security[key] ? 'bg-[#0A3D8F]' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${security[key] ? "left-6" : "left-0.5"}`}></span>
                        </button>
                      </div>
                    ))}
                    <div className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Session Timeout</p>
                        <p className="text-xs text-gray-500 mt-0.5">Auto logout after inactivity</p>
                      </div>
                      <select id="security-session-timeout" value={security.sessionTimeout} onChange={e => setSecurity(p => ({...p, sessionTimeout: e.target.value}))}
                        className="w-full max-w-[260px] px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none cursor-pointer sm:w-auto sm:max-w-none sm:py-1.5"
                        aria-label="Session timeout duration">
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="border-b border-gray-200 p-4 sm:p-6">
                  <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Choose what events trigger email notifications</p>
                </div>
                <div className="space-y-3 p-4 sm:p-6">
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
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifs(p => ({...p, [key]: !p[key]}))}
                        className={`relative h-6 w-12 shrink-0 self-end rounded-full transition-colors cursor-pointer sm:self-auto ${notifs[key] ? 'bg-[#0A3D8F]' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${notifs[key] ? 'left-6' : 'left-0.5'}`}></span>
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-stretch pt-2 sm:justify-end">
                    <button type="button" onClick={() => showSuccess('Notification preferences saved!')} className="w-full px-6 py-2.5 bg-[#0A3D8F] text-white rounded-lg text-sm font-medium hover:bg-[#083170] cursor-pointer sm:w-auto">
                      Save Preferences
                    </button>
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
