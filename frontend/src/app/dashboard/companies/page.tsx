"use client";

import { Suspense, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { companies, type Company } from '../../../mocks/companies';
import CompanyToolbar from './components/CompanyToolbar';
import CompanyRow from './components/CompanyRow';
import ClickedCompany from './components/ClickedCompany';
import styles from './page.module.css';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type TabType = 'All' | 'Active' | 'Pending' | 'Inactive';

const TABS: TabType[] = ['All', 'Active', 'Pending', 'Inactive'];
const PER_PAGE = 10;

export default function CompaniesPage() {
  return (
    <Suspense fallback={null}>
      <CompaniesPageContent />
    </Suspense>
  );
}

function CompaniesPageContent() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [companyList, setCompanyList] = useState<Company[]>(companies);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openedCompany, setOpenedCompany] = useState<Company | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: 'Technology',
    status: 'Pending' as Company['status'],
    website: '',
    address: '',
    email: '',
    contactPerson: '',
    phone: '',
    notes: '',
  });

  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const router = useRouter();
  const pathname = usePathname();
  const isSuperadminRoute = pathname.startsWith('/superadmin');

  useEffect(() => {
    if (!tabFromUrl) return;
    const nextTab = (TABS as string[]).includes(tabFromUrl) ? (tabFromUrl as TabType) : null;
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setPage(1);
    }
  }, [tabFromUrl, activeTab]);

  const filtered = companyList.filter((c) => {
    const matchTab = activeTab === 'All' || c.status === activeTab;
    const query = search.toLowerCase();
    const matchSearch =
      search === '' ||
      c.name.toLowerCase().includes(query) ||
      c.contact.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.industry.toLowerCase().includes(query);
    return matchTab && matchSearch;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const getTabCount = (tab: TabType) => {
    if (tab === 'All') return companyList.length;
    return companyList.filter((c) => c.status === tab).length;
  };

  const industryColors: Record<string, string> = {
    Technology: 'bg-blue-100 text-blue-700',
    Finance: 'bg-green-100 text-green-700',
    Healthcare: 'bg-teal-100 text-teal-700',
    Manufacturing: 'bg-orange-100 text-orange-700',
    Consulting: 'bg-cyan-100 text-cyan-700',
    Investment: 'bg-amber-100 text-amber-700',
    'Real Estate': 'bg-rose-100 text-rose-700',
    Logistics: 'bg-indigo-100 text-indigo-700',
    Legal: 'bg-purple-100 text-purple-700',
    Retail: 'bg-pink-100 text-pink-700',
  };

  const handleAddCompany = () => {
    if (!newCompany.name || !newCompany.email) return;

    const nextId = companyList.length ? Math.max(...companyList.map((c) => c.id)) + 1 : 1;
    const now = new Date();
    const created: Company = {
      id: nextId,
      starred: false,
      flagged: false,
      name: newCompany.name,
      initial: newCompany.name.charAt(0).toUpperCase(),
      avatarColor: 'bg-[#0A3D8F]',
      industry: newCompany.industry,
      industryBadge: industryColors[newCompany.industry] ?? 'bg-slate-100 text-slate-700',
      contact: newCompany.contactPerson || 'N/A',
      email: newCompany.email,
      mails: 0,
      cheques: 0,
      status: newCompany.status,
      time: 'Just now',
      joined: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      phone: newCompany.phone || 'N/A',
      address: newCompany.address || 'N/A',
      chequeValue: 0,
      notes: newCompany.notes || 'No notes added.',
      lastActivity: 'Just now',
    };

    setCompanyList((prev) => [created, ...prev]);
    setAddSuccess(true);
    window.setTimeout(() => {
      setShowAddModal(false);
      setAddSuccess(false);
      setNewCompany({
        name: '',
        industry: 'Technology',
        status: 'Pending',
        website: '',
        address: '',
        email: '',
        contactPerson: '',
        phone: '',
        notes: '',
      });
      setActiveTab('All');
      setPage(1);
    }, 900);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <Icon icon="ri:search-line" className="text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.topActions}>
          <button
            className={styles.addBtn}
            onClick={() => {
              setAddSuccess(false);
              setShowAddModal(true);
            }}
          >
            <div className={styles.addBtnIcon}>
              <Icon icon="ri:add-line" className="text-sm" />
            </div>
            Add Company
          </button>

          {!isSuperadminRoute && (
          <>
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer relative"
            >
              <Icon icon="ri:notification-3-line" className="text-[20px] text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-[320px] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">Notifications</div>
                <div className="px-4 py-3 text-xs text-gray-600">No new notifications</div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm">AD</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 leading-4">Admin User</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-[180px] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden">
                <Link href="/dashboard/settings/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:user-line" className="text-sm" /></div>
                  My Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:settings-3-line" className="text-sm" /></div>
                  Settings
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <a href="/login" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer">
                  <Icon icon="ri:logout-box-r-line" className="text-sm" />
                  Sign Out
                </a>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      <CompanyToolbar
        total={filtered.length}
        page={page}
        perPage={PER_PAGE}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(Math.ceil(filtered.length / PER_PAGE), p + 1))}
      />

      <div className={styles.tabsContainer}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
              router.replace(`${pathname}?tab=${encodeURIComponent(tab)}`);
            }}
            className={activeTab === tab ? styles.tabActive : styles.tab}
          >
            {tab}
            {tab !== 'All' && (
              <span className={activeTab === tab ? styles.badgeActive : styles.badge}>{getTabCount(tab)}</span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.listContainer}>
        <div className={styles.listInner}>
        {paginated.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Icon icon="ri:building-line" className="text-3xl" /></div>
            <p className={styles.emptyText}>No companies found</p>
          </div>
        ) : (
          paginated.map((company) => (
            <CompanyRow
              key={company.id}
              company={company}
              selected={selectedIds.includes(company.id)}
              onSelect={handleSelect}
              onClick={() => setOpenedCompany(company)}
            />
          ))
        )}
        </div>
      </div>

      {openedCompany && <ClickedCompany company={openedCompany} onClose={() => setOpenedCompany(null)} />}

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-white h-full w-full max-w-xl flex flex-col shadow-2xl animate-[slideInRight_0.25s_ease-out] rounded-l-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#0A3D8F]/10 rounded-xl flex items-center justify-center">
                  <i className="ri-building-line text-[#0A3D8F] text-xl"></i>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add New Company</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Fill in the company details below</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <i className="ri-close-line text-slate-600 text-xl"></i>
              </button>
            </div>

            {addSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="ri-check-line text-[#2F8F3A] text-4xl"></i>
                </div>
                <p className="text-lg font-bold text-slate-900">Company Added!</p>
                <p className="text-sm text-slate-500 text-center">The new company has been created successfully and is now visible in your list.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-7">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-6 h-6 bg-[#0A3D8F] rounded-md flex items-center justify-center flex-shrink-0">
                      <i className="ri-building-line text-white text-xs"></i>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Company Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                      <input type="text" value={newCompany.name} onChange={(e) => setNewCompany((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Acme Corporation" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="companyIndustry" className="block text-xs font-semibold text-slate-600 mb-1.5">Industry</label>
                        <select id="companyIndustry" value={newCompany.industry} onChange={(e) => setNewCompany((p) => ({ ...p, industry: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all bg-white cursor-pointer">
                          {Object.keys(industryColors).map((ind) => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="companyStatus" className="block text-xs font-semibold text-slate-600 mb-1.5">Initial Status</label>
                        <select id="companyStatus" value={newCompany.status} onChange={(e) => setNewCompany((p) => ({ ...p, status: e.target.value as Company['status'] }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all bg-white cursor-pointer">
                          <option value="Pending">Pending</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Website</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">https://</span>
                        <input type="text" value={newCompany.website} onChange={(e) => setNewCompany((p) => ({ ...p, website: e.target.value }))} placeholder="www.company.com" className="w-full pl-16 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address</label>
                      <input type="text" value={newCompany.address} onChange={(e) => setNewCompany((p) => ({ ...p, address: e.target.value }))} placeholder="Street, City, State, ZIP" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100"></div>

                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-6 h-6 bg-[#2F8F3A] rounded-md flex items-center justify-center flex-shrink-0">
                      <i className="ri-user-line text-white text-xs"></i>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Contact Details</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
                        <input type="email" value={newCompany.email} onChange={(e) => setNewCompany((p) => ({ ...p, email: e.target.value }))} placeholder="info@company.com" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contact Person</label>
                        <input type="text" value={newCompany.contactPerson} onChange={(e) => setNewCompany((p) => ({ ...p, contactPerson: e.target.value }))} placeholder="Full name" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
                        <div className="relative">
                          <i className="ri-phone-line absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"></i>
                          <input type="text" value={newCompany.phone} onChange={(e) => setNewCompany((p) => ({ ...p, phone: e.target.value }))} placeholder="+1 (000) 000-0000" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100"></div>

                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-6 h-6 bg-amber-500 rounded-md flex items-center justify-center flex-shrink-0">
                      <i className="ri-sticky-note-line text-white text-xs"></i>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Notes & Instructions</h3>
                  </div>
                  <textarea value={newCompany.notes} onChange={(e) => setNewCompany((p) => ({ ...p, notes: e.target.value }))} placeholder="Any special handling instructions, preferences, or important notes about this company..." rows={4} maxLength={500} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all resize-none" />
                  <p className="text-xs text-slate-400 mt-1 text-right">{newCompany.notes.length}/500</p>
                </div>
              </div>
            )}

            {!addSuccess && (
              <div className="px-7 py-5 border-t border-slate-200 flex-shrink-0 bg-slate-50/80">
                <div className="flex items-center justify-between mb-3">
                  {(!newCompany.name || !newCompany.email) && (
                    <p className="text-xs text-slate-400 flex items-center space-x-1">
                      <i className="ri-information-line"></i>
                      <span>Company name and email are required</span>
                    </p>
                  )}
                  {newCompany.name && newCompany.email && (
                    <p className="text-xs text-[#2F8F3A] flex items-center space-x-1">
                      <i className="ri-check-line"></i>
                      <span>Ready to add</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm whitespace-nowrap cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleAddCompany} disabled={!newCompany.name || !newCompany.email} className="flex-1 py-2.5 bg-[#0A3D8F] text-white font-bold rounded-xl hover:bg-[#083170] transition-colors text-sm whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    <i className="ri-building-line text-base"></i>
                    <span>Add Company</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.6; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
