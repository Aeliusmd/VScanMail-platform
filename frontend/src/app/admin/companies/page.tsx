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
import { useSuperAdminToolbarOptional } from '../../superadmin/components/SuperAdminToolbarContext';
import { apiClient } from '@/lib/api-client';
import { useAdminProfile } from '../components/useAdminProfile';

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
  const { userData, initials, displayName, displayRole } = useAdminProfile();
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openedCompany, setOpenedCompany] = useState<Company | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: 'Technology',
    status: 'Pending' as Company['status'],
    website: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
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
  const superToolbar = useSuperAdminToolbarOptional();
  const search = isSuperadminRoute && superToolbar ? superToolbar.search : localSearch;
  const canManageOrganizations = isSuperadminRoute;

  useEffect(() => {
    if (!isSuperadminRoute || !superToolbar) return;
    superToolbar.setAddCompanyHandler(() => {
      setEditingCompany(null);
      setAddSuccess(false);
      setNewCompany({
        name: '',
        industry: 'Technology',
        status: 'Pending',
        website: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        email: '',
        contactPerson: '',
        phone: '',
        notes: '',
      });
      setShowAddModal(true);
    });
    return () => superToolbar.setAddCompanyHandler(null);
  }, [isSuperadminRoute, superToolbar]);

  useEffect(() => {
    if (!isSuperadminRoute || !superToolbar) return;
    setPage(1);
  }, [superToolbar?.search, isSuperadminRoute, superToolbar]);

  useEffect(() => {
    if (!tabFromUrl) return;
    const nextTab = (TABS as string[]).includes(tabFromUrl) ? (tabFromUrl as TabType) : null;
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setPage(1);
    }
  }, [tabFromUrl, activeTab]);

  const mapClientToCompany = (c: any): Company => {
    const name = c.company_name;
    const initial = name.charAt(0).toUpperCase();
    
    // Pick an avatar color based on the first letter
    const colors = [
      'bg-[#0A3D8F]', 'bg-[#1E40AF]', 'bg-[#0369A1]', 
      'bg-[#0E7490]', 'bg-[#155E75]', 'bg-[#164E63]'
    ];
    const colorIdx = initial.charCodeAt(0) % colors.length;

    // Build address string safely
    const addr = c.address_json || {};
    const street = addr.street || '';
    const city = addr.city || '';
    const addressStr = [street, city].filter(Boolean).join(', ') || 'N/A';

    return {
      id: c.id,
      starred: false,
      flagged: false,
      name: c.company_name,
      initial,
      avatarColor: colors[colorIdx],
      industry: c.industry || 'Other',
      industryBadge: industryColors[c.industry] || 'bg-slate-100 text-slate-700',
      contact: c.email.split('@')[0], // Fallback if no contact person
      email: c.email,
      mails: 0, 
      cheques: 0,
      status: (c.status.charAt(0).toUpperCase() + c.status.slice(1)) as any,
      time: new Date(c.created_at).toLocaleDateString(),
      joined: new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      phone: c.phone || 'N/A',
      address: addressStr,
      address_json: addr,
      chequeValue: 0,
      notes: c.notes || 'No notes added.',
      lastActivity: 'Just now',
      clientType: c.client_type as any,
    };
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await apiClient<{ clients: any[] }>('/api/clients?limit=100');
      const mapped = data.clients.map(mapClientToCompany);
      setCompanyList(mapped);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

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

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setNewCompany({
      name: company.name,
      industry: company.industry,
      status: company.status,
      website: '', 
      street: company.address_json?.street || '',
      city: company.address_json?.city || '',
      state: company.address_json?.state || '',
      zip: company.address_json?.zip || '',
      country: company.address_json?.country || '',
      email: company.email,
      contactPerson: company.contact,
      phone: company.phone,
      notes: company.notes,
    });
    setAddSuccess(false);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) return;
    
    try {
      await apiClient(`/api/clients/${id}`, { method: 'DELETE' });
      await fetchCompanies();
    } catch (err: any) {
      alert(err.message || "Failed to delete company");
    }
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

  const handleAddCompany = async () => {
    if (!newCompany.name || !newCompany.email) return;
    setSaving(true);

    try {
      const endpoint = editingCompany ? `/api/clients/${editingCompany.id}` : '/api/clients';
      const method = editingCompany ? 'PATCH' : 'POST';

      await apiClient(endpoint, {
        method,
        body: JSON.stringify({
          companyName: newCompany.name,
          industry: newCompany.industry,
          email: newCompany.email,
          phone: newCompany.phone,
          status: newCompany.status.toLowerCase(),
          addressJson: { 
            street: newCompany.street, 
            city: newCompany.city, 
            state: newCompany.state, 
            zip: newCompany.zip, 
            country: newCompany.country 
          },
          notes: newCompany.notes,
          clientType: 'manual'
        })
      });

      setAddSuccess(true);
      await fetchCompanies(); // Refresh the list
      
      window.setTimeout(() => {
      setShowAddModal(false);
      setAddSuccess(false);
      setNewCompany({
        name: '',
        industry: 'Technology',
        status: 'Pending',
        website: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        email: '',
        contactPerson: '',
        phone: '',
        notes: '',
      });
      setActiveTab('All');
      setPage(1);
    }, 900);
    } catch (err: any) {
      alert(err.message || "Failed to add company");
    } finally {
      setSaving(false);
    }
  };

  const [saving, setSaving] = useState(false);

  return (
    <div className={styles.pageContainer}>
      {!isSuperadminRoute && (
      <div className={styles.topBar}>
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <Icon icon="ri:search-line" className="text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search Organizations..."
            value={search}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.topActions}>
          

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
              <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                {userData?.avatarUrl ? <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 leading-4">{displayName}</p>
                <p className="text-xs text-gray-500 uppercase">{displayRole}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-[180px] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden">
                <Link href="/admin/settings/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:user-line" className="text-sm" /></div>
                  My Profile
                </Link>
                <Link
                  href="/admin/settings"
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
        </div>
      </div>
      )}

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
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#0A3D8F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium font-outfit">Loading companies...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center px-4">
             <Icon icon="ri:error-warning-line" className="text-4xl text-red-500 mx-auto mb-4" />
             <p className="text-red-600 font-bold mb-2">Error Loading Data</p>
             <p className="text-slate-500 text-sm">{error}</p>
             <button onClick={fetchCompanies} className="mt-6 px-4 py-2 bg-[#0A3D8F] text-white rounded-lg text-sm font-semibold">Try Again</button>
          </div>
        ) : paginated.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Icon icon="ri:building-line" className="text-3xl" /></div>
            <p className={styles.emptyText}>No organizations found</p>
          </div>
        ) : (
          paginated.map((company) => (
            <CompanyRow
              key={company.id}
              company={company}
              selected={selectedIds.includes(company.id)}
              onSelect={handleSelect}
              onEdit={canManageOrganizations ? handleEdit : undefined}
              onDelete={canManageOrganizations ? handleDelete : undefined}
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
                  <h2 className="text-base font-bold text-slate-900">{editingCompany ? 'Edit Organization' : 'Add New Organization'}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{editingCompany ? 'Update organization details below' : 'Fill in the organization details below'}</p>
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
                <p className="text-lg font-bold text-slate-900">{editingCompany ? 'Organization Updated!' : 'Organization Added!'}</p>
                <p className="text-sm text-slate-500 text-center">The organization details have been saved successfully.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-7">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-6 h-6 bg-[#0A3D8F] rounded-md flex items-center justify-center flex-shrink-0">
                      <i className="ri-building-line text-white text-xs"></i>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Organization Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Organization Name <span className="text-red-500">*</span></label>
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
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Street Address</label>
                      <input type="text" value={newCompany.street} onChange={(e) => setNewCompany((p) => ({ ...p, street: e.target.value }))} placeholder="e.g. 123 Business Way" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
                        <input type="text" value={newCompany.city} onChange={(e) => setNewCompany((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">State / Province</label>
                        <input type="text" value={newCompany.state} onChange={(e) => setNewCompany((p) => ({ ...p, state: e.target.value }))} placeholder="State" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">ZIP / Postal Code</label>
                        <input type="text" value={newCompany.zip} onChange={(e) => setNewCompany((p) => ({ ...p, zip: e.target.value }))} placeholder="ZIP Code" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Country</label>
                        <input type="text" value={newCompany.country} onChange={(e) => setNewCompany((p) => ({ ...p, country: e.target.value }))} placeholder="e.g. USA" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#0A3D8F] focus:ring-1 focus:ring-[#0A3D8F]/20 transition-all" />
                      </div>
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
                      <span>Organization name and email are required</span>
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
                  <button onClick={handleAddCompany} disabled={!newCompany.name || !newCompany.email || saving} className="flex-1 py-2.5 bg-[#0A3D8F] text-white font-bold rounded-xl hover:bg-[#083170] transition-colors text-sm whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <i className={editingCompany ? "ri-save-line text-base" : "ri-building-line text-base"}></i>
                        <span>{editingCompany ? 'Save Changes' : 'Add Organization'}</span>
                      </>
                    )}
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
