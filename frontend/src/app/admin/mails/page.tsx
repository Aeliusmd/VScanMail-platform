"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { apiClient } from '@/lib/api-client';
import MailToolbar from './components/MailToolbar';
import MailRow from './components/MailRow';
import ClickedMail from './clickedmail/clickedmail';
import styles from './page.module.css';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

type TabType = 'All' | 'Processed' | 'Delivered' | 'Pending Delivery';
type FolderType = 'inbox' | 'archived';

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
  const [mailItems, setMailItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeFolder, setActiveFolder] = useState<FolderType>('inbox');
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openedMail, setOpenedMail] = useState<any | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveBoxNumber, setArchiveBoxNumber] = useState('');
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [archivedCount, setArchivedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const router = useRouter();
  const pathname = usePathname();
  const isSuperadminRoute = pathname.startsWith('/superadmin');
  const scanPath = isSuperadminRoute ? '/superadmin/scan' : '/admin/scan';

  const fetchMails = useCallback(async () => {
    setLoading(true);
    try {
      let status;
      if (activeTab === 'Processed') status = 'processed';
      if (activeTab === 'Delivered') status = 'delivered';
      if (activeTab === 'Pending Delivery') status = 'scanned';

      const data = await apiClient<{ items: any[]; total: number }>('/api/records/mail', {
        params: {
          page,
          limit: PER_PAGE,
          status: status,
          search: search || undefined
        }
      } as any);

      // Map API items to the UI Mail interface
      const mappedItems = data.items.map(item => ({
        id: item.id,
        sender: item.company_name, 
        subject: `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} - ${item.irn}`,
        preview: item.ai_summary || 'No preview available.',
        time: new Date(item.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(item.scanned_at).toLocaleDateString(),
        company: item.company_name,
        tag: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        archived: item.status === 'delivered',
        senderInitial: item.company_name.charAt(0).toUpperCase(),
        senderColor: 'bg-blue-600',
        raw: item 
      }));

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
  }, [page, activeTab, search]);

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

  const handleArchiveConfirm = () => {
    if (!archiveBoxNumber.trim()) return;
    // Note: Local update only for UI feel, real archive should be an API call
    setMailItems((prev) =>
      prev.map((m) =>
        selectedIds.includes(m.id)
          ? { ...m, archived: true, archiveBox: archiveBoxNumber.trim() }
          : m
      )
    );
    setSelectedIds([]);
    setArchiveSuccess(true);
    setTimeout(() => {
      setArchiveSuccess(false);
      setShowArchiveModal(false);
      setArchiveBoxNumber('');
    }, 1800);
  };

  const handleUnarchiveSelected = () => {
    setMailItems((prev) =>
      prev.map((m) =>
        selectedIds.includes(m.id)
          ? { ...m, archived: false, archiveBox: undefined }
          : m
      )
    );
    setSelectedIds([]);
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
          {activeFolder === 'inbox' ? (
            <button
              onClick={() => setShowArchiveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <Icon icon="ri:archive-line" className="text-sm" />
              Archive
            </button>
          ) : (
            <button
              onClick={handleUnarchiveSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <Icon icon="ri:inbox-unarchive-line" className="text-sm" />
              Unarchive
            </button>
          )}
          <span className="text-xs text-slate-500">{selectedIds.length} selected</span>
        </div>
      )}

      <div className="px-4 border-b border-gray-100 flex items-center gap-1">
        <button
          onClick={() => {
            setActiveFolder('inbox');
            setSelectedIds([]);
            setPage(1);
          }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${activeFolder === 'inbox' ? 'border-[#1E40AF] text-[#1E40AF]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Inbox
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeFolder === 'inbox' ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-gray-100 text-gray-500'}`}>
            {mailItems.filter((m) => !m.archived).length}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveFolder('archived');
            setSelectedIds([]);
            setPage(1);
          }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${activeFolder === 'archived' ? 'border-[#1E40AF] text-[#1E40AF]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Archived
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeFolder === 'archived' ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-gray-100 text-gray-500'}`}>
            {mailItems.filter((m) => m.archived).length}
          </span>
        </button>
      </div>

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
              showArchiveMeta={activeFolder === 'archived'}
              showUnarchive={activeFolder === 'archived'}
              onUnarchive={() =>
                setMailItems((prev) =>
                  prev.map((m) =>
                    m.id === mail.id ? { ...m, archived: false, archiveBox: undefined } : m
                  )
                )
              }
            />
          ))
        )}
        </div>
      </div>

      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setShowArchiveModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {archiveSuccess ? (
              <div className="p-10 flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="ri-check-line text-[#2F8F3A] text-3xl"></i>
                </div>
                <p className="text-lg font-bold text-slate-900">Archived Successfully</p>
                <p className="text-sm text-slate-500 text-center">
                  {archivedCount > 0 ? `${archivedCount} mail(s)` : 'Selected mails'} archived to Box <strong>{archiveBoxNumber}</strong>
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <i className="ri-archive-line text-slate-600 text-xl"></i>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Archive Mails</h2>
                      <p className="text-xs text-slate-500">{selectedIds.length} mail(s) selected</p>
                    </div>
                  </div>
                  <button onClick={() => setShowArchiveModal(false)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
                    <i className="ri-close-line text-slate-600 text-xl"></i>
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <i className="ri-information-line text-amber-600 text-lg mt-0.5"></i>
                      <p className="text-sm text-amber-700">
                        Please enter the physical box number where these mails will be stored. This helps track the physical location of archived documents.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Box Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. BOX-2025-A1, Box 14, Archive-Q2..."
                      value={archiveBoxNumber}
                      onChange={e => setArchiveBoxNumber(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A3D8F] focus:ring-2 focus:ring-[#0A3D8F]/10"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleArchiveConfirm()}
                    />
                    <p className="text-xs text-slate-400 mt-1.5">Enter the box or folder label for physical storage reference</p>
                  </div>
                  <div className="flex space-x-3 pt-1">
                    <button
                      onClick={() => setShowArchiveModal(false)}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm whitespace-nowrap cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleArchiveConfirm}
                      disabled={!archiveBoxNumber.trim()}
                      className="flex-1 py-3 bg-[#0A3D8F] text-white font-semibold rounded-xl hover:bg-[#083170] transition-colors text-sm whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="ri-archive-line mr-2"></i>Confirm Archive
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Popup */}
      {openedMail && (
        <ClickedMail mail={openedMail} onClose={() => setOpenedMail(null)} />
      )}
    </div>
  );
}
