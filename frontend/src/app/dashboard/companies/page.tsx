"use client";

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import type { Company } from '../../../mocks/companies';
import CompanyToolbar from './components/CompanyToolbar';
import CompanyRow from './components/CompanyRow';
import ClickedCompany from './components/ClickedCompany';
import styles from './page.module.css';
import { companyApi } from '@/lib/api/companies';

type TabType = 'All' | 'Active' | 'Pending' | 'Inactive';

const TABS: TabType[] = ['All', 'Active', 'Pending', 'Inactive'];
const PER_PAGE = 10;

export default function CompaniesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openedCompany, setOpenedCompany] = useState<Company | null>(null);
  const [remoteCompanies, setRemoteCompanies] = useState<Company[]>([]);

  useEffect(() => {
    // Companies listing is admin-only. For non-admin roles, the API will error and we show an empty list.
    companyApi
      .list({ page: 1, limit: 50 })
      .then((res) => {
        const items = res.clients || [];
        const mapped: Company[] = items.map((c: any, idx: number) => {
          const statusUI: Company["status"] =
            c.status === "active" ? "Active" : c.status === "pending" ? "Pending" : "Inactive";

          const address = c.address_json
            ? `${c.address_json.street}, ${c.address_json.city}, ${c.address_json.state} ${c.address_json.zip}, ${c.address_json.country}`
            : "";

          return {
            id: idx + 1,
            backendId: c.id,
            starred: false,
            flagged: false,
            name: c.company_name,
            initial: (c.company_name || "C").charAt(0).toUpperCase(),
            avatarColor: "bg-[#0A3D8F]",
            industry: c.industry || "—",
            industryBadge:
              c.status === "active"
                ? "bg-green-100 text-green-700"
                : c.status === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-600",
            contact: "—",
            email: c.email,
            mails: 0,
            cheques: 0,
            status: statusUI,
            time: new Date(c.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            joined: new Date(c.created_at).toLocaleDateString("en-US"),
            phone: c.phone || "—",
            address: address || "—",
            chequeValue: 0,
            notes: "—",
            lastActivity: c.created_at ? new Date(c.created_at).toLocaleString("en-US") : "—",
          };
        });
        setRemoteCompanies(mapped);
      })
      .catch(() => setRemoteCompanies([]));
  }, []);

  const filtered = remoteCompanies.filter((c) => {
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
    if (tab === 'All') return remoteCompanies.length;
    return remoteCompanies.filter((c) => c.status === tab).length;
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
          <button className={styles.addBtn}>
            <div className={styles.addBtnIcon}>
              <Icon icon="ri:add-line" className="text-sm" />
            </div>
            Add Company
          </button>

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
              <div className="absolute right-0 top-12 w-[320px] bg-white rounded-xl shadow-lg border border-gray-100 z-50">
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
              <div className="absolute right-0 top-12 w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
                <a href="#" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">My Profile</a>
                <a href="#" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Settings</a>
                <div className="border-t border-gray-100 my-1"></div>
                <a href="/login" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">Sign Out</a>
              </div>
            )}
          </div>
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
    </div>
  );
}
