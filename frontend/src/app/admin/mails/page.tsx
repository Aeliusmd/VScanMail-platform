"use client";

import { Suspense, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { mails, type Mail } from '../../../mocks/mails';
import MailToolbar from './components/MailToolbar';
import MailRow from './components/MailRow';
import ClickedMail from './clickedmail/clickedmail';
import styles from './page.module.css';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

type TabType = 'All' | 'Processed' | 'Delivered' | 'Pending Delivery';

const TABS: { label: TabType; count: number }[] = [
  { label: 'All', count: 10 },
  { label: 'Processed', count: 6 },
  { label: 'Delivered', count: 3 },
  { label: 'Pending Delivery', count: 1 },
];

const PER_PAGE = 10;

export default function AllMailsPage() { 
  return (
    <Suspense fallback={null}>
      <AllMailsPageContent />
    </Suspense>
  );
}

function AllMailsPageContent() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openedMail, setOpenedMail] = useState<Mail | null>(null);

  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const router = useRouter();
  const pathname = usePathname();
  const isSuperadminRoute = pathname.startsWith('/superadmin');
  const scanPath = isSuperadminRoute ? '/superadmin/scan' : '/admin/scan';

  // Keep the tab UI in sync when selecting filters via sidebar labels.
  useEffect(() => {
    if (!tabFromUrl) return;
    const nextTab = TABS.find((t) => t.label === tabFromUrl)?.label;
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setPage(1);
    }
  }, [tabFromUrl, activeTab]);

  // Mock Notifications for Mail Page Topbar
  const notifications = [
    { id: 1, text: 'New mail received from Tech Solutions Inc', time: '5 mins ago', unread: true },
    { id: 2, text: 'Cheque deposit request from Global Enterprises', time: '12 mins ago', unread: true },
    { id: 3, text: 'Delivery completed for Innovate Corp', time: '25 mins ago', unread: false },
    { id: 4, text: 'New company registration pending approval', time: '1 hour ago', unread: false },
  ];

  const filtered = mails.filter((m) => {
    const matchTab =
      activeTab === 'All' ||
      (activeTab === 'Processed' && m.tag === 'Inbox') ||
      (activeTab === 'Delivered' && m.tag === 'Delivered') ||
      (activeTab === 'Pending Delivery' && m.tag === 'Pending');
    const matchSearch =
      search === '' ||
      m.sender.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.company.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSelect = (id: number) => {
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
              <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                AD
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 leading-4">Admin User</p>
                <p className="text-xs text-gray-500">Administrator</p>
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
        total={filtered.length}
        page={page}
        perPage={PER_PAGE}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {TABS.map((tab) => (
          <button
            key={tab.label}
                onClick={() => {
                  setActiveTab(tab.label);
                  setPage(1);
                  router.replace(`${pathname}?tab=${encodeURIComponent(tab.label)}`);
                }}
            className={activeTab === tab.label ? styles.tabActive : styles.tab}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={activeTab === tab.label ? styles.badgeActive : styles.badge}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mail List */}
      <div className={styles.listContainer}>
        <div className={styles.listInner}>
        {paginated.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icon icon="ri:mail-open-line" className="text-3xl" />
            </div>
            <p className={styles.emptyText}>No mails found</p>
          </div>
        ) : (
          paginated.map((mail) => (
            <MailRow
              key={mail.id}
              mail={mail}
              selected={selectedIds.includes(mail.id)}
              onSelect={handleSelect}
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
