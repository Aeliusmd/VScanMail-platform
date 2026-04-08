"use client";

import { Suspense, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { cheques, type Cheque } from '../../../mocks/cheques';
import ChequeToolbar from './components/ChequeToolbar';
import ChequeRow from './components/ChequeRow';
import ClickedCheque from './components/ClickedCheque';
import styles from './page.module.css';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type TabType = 'All' | 'Pending Deposit' | 'Deposited' | 'Rejected' | 'On Hold';
type FolderType = 'active' | 'archived';
type ChequeItem = Cheque & { archived?: boolean; archiveBox?: string };

const TABS: { label: TabType }[] = [
  { label: 'All' },
  { label: 'Pending Deposit' },
  { label: 'Deposited' },
  { label: 'Rejected' },
  { label: 'On Hold' },
];

const PER_PAGE = 10;

export default function AllChequesPage() {
  return (
    <Suspense fallback={null}>
      <AllChequesPageContent />
    </Suspense>
  );
}

function AllChequesPageContent() {
  const [chequeItems, setChequeItems] = useState<ChequeItem[]>(cheques);
  const [activeFolder, setActiveFolder] = useState<FolderType>('active');
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openedCheque, setOpenedCheque] = useState<Cheque | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveBoxNumber, setArchiveBoxNumber] = useState('');
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [archivedCount, setArchivedCount] = useState(0);

  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const router = useRouter();
  const pathname = usePathname();
  const isSuperadminRoute = pathname.startsWith('/superadmin');
  const scanPath = isSuperadminRoute ? '/superadmin/scan' : '/admin/scan';

  useEffect(() => {
    if (!tabFromUrl) return;
    const nextTab = TABS.find((t) => t.label === tabFromUrl)?.label;
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setPage(1);
    }
  }, [tabFromUrl, activeTab]);

  const notifications = [
    { id: 1, text: 'Cheque deposited for Global Enterprises', time: '5 mins ago', unread: true },
    { id: 2, text: 'Pending deposit for Horizon Group', time: '12 mins ago', unread: true },
    { id: 3, text: 'Rejected cheque requires review', time: '25 mins ago', unread: false },
  ];

  const visibleCheques = chequeItems.filter((c) => (activeFolder === 'active' ? !c.archived : !!c.archived));

  const filtered = visibleCheques.filter((c) => {
    const matchTab = activeTab === 'All' || c.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      search === '' ||
      c.company.toLowerCase().includes(q) ||
      c.bankName.toLowerCase().includes(q) ||
      c.chequeNumber.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  const totalAmount = filtered.reduce((sum, c) => sum + c.amount, 0);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((c) => c.id === id)));
      return;
    }
    const ids = filtered.map((c) => c.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleArchiveConfirm = () => {
    if (!archiveBoxNumber.trim()) return;
    const currentSelectedCount = selectedIds.length;
    setArchivedCount(currentSelectedCount);
    setChequeItems((prev) =>
      prev.map((c) =>
        selectedIds.includes(c.id)
          ? { ...c, archived: true, archiveBox: archiveBoxNumber.trim() }
          : c
      )
    );
    setSelectedIds([]);
    setArchiveSuccess(true);
    setPage(1);
    setTimeout(() => {
      setArchiveSuccess(false);
      setShowArchiveModal(false);
      setArchiveBoxNumber('');
      setArchivedCount(0);
    }, 1800);
  };

  const handleUnarchiveSelected = () => {
    setChequeItems((prev) =>
      prev.map((c) =>
        selectedIds.includes(c.id)
          ? { ...c, archived: false, archiveBox: undefined }
          : c
      )
    );
    setSelectedIds([]);
  };

  const getTabCount = (status: TabType) => {
    if (status === 'All') return visibleCheques.length;
    return visibleCheques.filter((c) => c.status === status).length;
  };

  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <div className={styles.searchWrapper}>
          <div className={styles.searchIcon}>
            <Icon icon="ri:search-line" className="text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search cheques..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.topActions}>
          <Link href={scanPath}>
            <button className={styles.addBtn}>
              <div className={styles.addBtnIcon}>
                <Icon icon="ri:scan-2-line" className="text-sm" />
              </div>
              New Scan
            </button>
          </Link>

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
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-900">Notifications</span>
                  <span className="text-xs text-[#1E40AF] cursor-pointer hover:underline">Mark all read</span>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex gap-3 ${n.unread ? 'bg-[#EFF6FF]/40' : ''}`}>
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EFF6FF] flex-shrink-0">
                        <Icon icon="ri:bank-card-line" className="text-[#1E40AF] text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-5">{n.text}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                      {n.unread && <span className="w-2 h-2 bg-[#1E40AF] rounded-full flex-shrink-0 mt-1.5"></span>}
                    </div>
                  ))}
                </div>
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
              <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                AD
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 leading-4">Admin User</p>
                <p className="text-xs text-gray-500">Administrator</p>
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
          )}
        </div>
      </div>

      {/* Toolbar */}
      <ChequeToolbar
        total={filtered.length}
        totalAmount={totalAmount}
        page={page}
        perPage={PER_PAGE}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(Math.ceil(filtered.length / PER_PAGE), p + 1))}
        allChecked={allVisibleSelected}
        onToggleAll={toggleSelectAll}
      />

      {selectedIds.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          {activeFolder === 'active' ? (
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
            setActiveFolder('active');
            setSelectedIds([]);
            setPage(1);
          }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${activeFolder === 'active' ? 'border-[#1E40AF] text-[#1E40AF]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Active
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeFolder === 'active' ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-gray-100 text-gray-500'}`}>
            {chequeItems.filter((c) => !c.archived).length}
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
            {chequeItems.filter((c) => c.archived).length}
          </span>
        </button>
      </div>

      <div className={styles.tabsBar}>
        {TABS.map((tab) => {
          const count = getTabCount(tab.label);

          return (
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
              {tab.label !== 'All' && (
                <span className={activeTab === tab.label ? styles.badgeActive : styles.badge}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cheque List */}
      <div className={styles.listContainer}>
        <div className={styles.listInner}>
          {paginated.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon icon="ri:bank-card-line" className="text-3xl" />
              </div>
              <p className={styles.emptyText}>No cheques found</p>
            </div>
          ) : (
            paginated.map((cheque) => (
              <ChequeRow
                key={cheque.id}
                cheque={cheque}
                selected={selectedIds.includes(cheque.id)}
                onSelect={handleSelect}
                onOpen={() => setOpenedCheque(cheque)}
                showArchiveMeta={activeFolder === 'archived'}
                showUnarchive={activeFolder === 'archived'}
                onUnarchive={() =>
                  setChequeItems((prev) =>
                    prev.map((c) =>
                      c.id === cheque.id ? { ...c, archived: false, archiveBox: undefined } : c
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
                  {archivedCount > 0 ? `${archivedCount} cheque(s)` : 'Selected cheques'} archived to Box <strong>{archiveBoxNumber}</strong>
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
                      <h2 className="text-base font-bold text-slate-900">Archive Cheques</h2>
                      <p className="text-xs text-slate-500">{selectedIds.length} cheque(s) selected</p>
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
                        Please enter the physical box number where these cheques will be stored. This helps track the physical location of archived documents.
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

      {/* Cheque Detail Modal */}
      {openedCheque && (
        <ClickedCheque cheque={openedCheque} onClose={() => setOpenedCheque(null)} />
      )}
    </div>
  );
}
