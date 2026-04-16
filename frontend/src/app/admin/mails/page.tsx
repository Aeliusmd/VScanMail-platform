"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { mailApi, type MailItem as ApiMailItem } from '@/lib/api/mail';
import MailToolbar from './components/MailToolbar';
import MailRow from './components/MailRow';
import ClickedMail from './clickedmail/clickedmail';
import styles from './page.module.css';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAdminProfile } from '../components/useAdminProfile';
import OrganizationPicker from '../components/OrganizationPicker';

type TabType = 'All' | 'Processed' | 'Delivered' | 'Pending Delivery';
const TABS: TabType[] = ['All', 'Processed', 'Delivered', 'Pending Delivery'];
const PER_PAGE = 10;

export default function AllMailsPage() { 
  return (
    <Suspense fallback={null}>
      <AllMailsPageContent />
    </Suspense>
  );
}

function AllMailsPageContent() {
  const { userData, initials, displayName, displayRole } = useAdminProfile();
  const [mailItems, setMailItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openedMail, setOpenedMail] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabFromUrl = searchParams.get('tab');
  const clientId = searchParams.get('clientId') || '';
  const router = useRouter();
  const pathname = usePathname();
  const isSuperadminRoute = pathname.startsWith('/superadmin');
  const scanPath = isSuperadminRoute ? '/superadmin/scan' : '/admin/scan';

  const fetchMails = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      let status;
      if (activeTab === 'Processed') status = 'processed';
      if (activeTab === 'Delivered') status = 'delivered';
      if (activeTab === 'Pending Delivery') status = 'scanned';

      const data = await mailApi.list({
        page,
        limit: PER_PAGE,
        status,
        search: search || undefined,
        archived: false,
        clientId,
      });

      // Map API items to the UI Mail interface
      const mappedItems = data.items.map(item => {
        const companyName = (item as any).company_name ?? 'Unknown Company';
        return {
        id: item.id,
        sender: companyName,
        subject: `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} - ${item.irn}`,
        preview: item.ai_summary || 'No preview available.',
        time: new Date(item.scanned_at || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(item.scanned_at || item.created_at).toLocaleDateString(),
        company: companyName,
        tag: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        archived: false,
        senderInitial: String(companyName).charAt(0).toUpperCase(),
        senderColor: 'bg-blue-600',
        raw: item,
      };
      });

      setMailItems(mappedItems);
      setTotalCount(data.total);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch mails:', err);
      // err.body contains the JSON body from the backend — use it for better diagnostics
      const detail = err?.body?.error || err?.message || 'Failed to connect to the recording system.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search, clientId]);

  useEffect(() => {
    fetchMails();
  }, [fetchMails]);

  // Keep the tab UI in sync when selecting filters via sidebar labels.
  useEffect(() => {
    if (!tabFromUrl) return;
    const nextTab = TABS.find((t) => t === tabFromUrl);
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setPage(1);
    }
  }, [tabFromUrl, activeTab]);

  if (!clientId) {
    return (
      <div className="p-6">
        <OrganizationPicker
          title="Mails"
          subtitle="Select an organization to view its mails."
          onPick={(c) => {
            const qs = new URLSearchParams(searchParams.toString());
            qs.set('clientId', c.id);
            router.replace(`${pathname}?${qs.toString()}`);
          }}
        />
      </div>
    );
  }

  // Mock Notifications for Mail Page Topbar
  const notifications = [
    { id: 1, text: 'New mail received from Tech Solutions Inc', time: '5 mins ago', unread: true },
    { id: 2, text: 'Cheque deposit request from Global Enterprises', time: '12 mins ago', unread: true },
    { id: 3, text: 'Delivery completed for Innovate Corp', time: '25 mins ago', unread: false },
    { id: 4, text: 'New company registration pending approval', time: '1 hour ago', unread: false },
  ];

  const visibleMails = mailItems; // Already filtered by server

  const tabCount = (tab: TabType) => {
    if (activeTab === tab) return totalCount;
    return 0; // For simplicity, only active tab shows count, or we need more API calls
  };

  const allVisibleSelected = visibleMails.length > 0 && visibleMails.every((m) => selectedIds.includes(m.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleMails.some((m) => m.id === id)));
      return;
    }

    const pageIds = visibleMails.map((m) => m.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top search bar */}
      <div className={styles.topBar}>
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <Icon icon="ri:search-line" className="text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search mail..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.topActions}>
          <Link href={scanPath}>
            <button className={styles.newScanBtn}>
              <div className={styles.newScanIcon}>
                <Icon icon="ri:scan-2-line" className="text-sm" />
              </div>
              New Scan
            </button>
          </Link>

          {!isSuperadminRoute && (
          <>
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer relative"
            >
              <div className={styles.notifIconWrap}>
                <Icon icon="ri:notification-3-line" className="text-[20px] leading-none" />
              </div>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-[320px] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-900">Notifications</span>
                  <span className="text-xs text-[#1E40AF] cursor-pointer hover:underline">Mark all read</span>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex gap-3 ${n.unread ? 'bg-[#EFF6FF]/40' : ''}`}>
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EFF6FF] flex-shrink-0">
                        <Icon icon="ri:mail-line" className="text-[#1E40AF] text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-5">{n.text}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                      {n.unread && <span className="w-2 h-2 bg-[#1E40AF] rounded-full flex-shrink-0 mt-1.5"></span>}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 text-center">
                  <span className="text-xs text-[#1E40AF] cursor-pointer hover:underline">View all notifications</span>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                {userData?.avatarUrl ? <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initials}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 leading-4">{displayName}</p>
                <p className="text-xs text-gray-500 uppercase">{displayRole}</p>
              </div>
              <div className="w-4 h-4 flex items-center justify-center text-gray-400">
                <Icon icon="ri:arrow-down-s-line" className="text-base" />
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
                  <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:logout-box-r-line" className="text-sm" /></div>
                  Sign Out
                </a>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <MailToolbar
        total={totalCount}
        page={page}
        perPage={PER_PAGE}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        allChecked={allVisibleSelected}
        onToggleAll={toggleSelectAll}
      />

      {selectedIds.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
        </div>
      )}

      {/* Tabs */}
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
            {tabCount(tab) > 0 && (
              <span className={activeTab === tab ? styles.badgeActive : styles.badge}>
                {tabCount(tab)}
              </span>
            )}
          </button>
        ))}
      </div>

        {/* Error State */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-800">
            <div className="flex items-center gap-3">
              <Icon icon="ri:error-warning-fill" className="text-xl" />
              <div>
                <p className="text-sm font-bold">Failed to load records</p>
                <p className="text-xs">{error}</p>
              </div>
            </div>
            <button 
              onClick={() => fetchMails()}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

      {/* Mail List */}
      <div className={styles.listContainer}>
        <div className={styles.listInner}>
        {visibleMails.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icon icon="ri:mail-open-line" className="text-3xl" />
            </div>
            <p className={styles.emptyText}>No mails found</p>
          </div>
        ) : (
          visibleMails.map((mail: any) => (
            <MailRow
              key={mail.id}
              mail={mail}
              selected={selectedIds.includes(mail.id)}
              onSelect={(id: any) => handleSelect(String(id))}
              onClick={() => setOpenedMail(mail)}
            />
          ))
        )}
        </div>
      </div>

      {/* Popup */}
      {openedMail && (
        <ClickedMail mail={openedMail} onClose={() => setOpenedMail(null)} />
      )}
    </div>
  );
}
