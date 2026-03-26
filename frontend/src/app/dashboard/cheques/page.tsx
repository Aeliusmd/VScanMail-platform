"use client";

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { cheques, type Cheque } from '../../../mocks/cheques';
import ChequeToolbar from './components/ChequeToolbar';
import ChequeRow from './components/ChequeRow';
import ClickedCheque from './components/ClickedCheque';
import styles from './page.module.css';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type TabType = 'All' | 'Pending Deposit' | 'Deposited' | 'Rejected' | 'On Hold';

const TABS: { label: TabType }[] = [
  { label: 'All' },
  { label: 'Pending Deposit' },
  { label: 'Deposited' },
  { label: 'Rejected' },
  { label: 'On Hold' },
];

const PER_PAGE = 10;

export default function AllChequesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openedCheque, setOpenedCheque] = useState<Cheque | null>(null);

  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const router = useRouter();
  const pathname = usePathname();

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

  const filtered = cheques.filter((c) => {
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

  const getTabCount = (status: TabType) => {
    if (status === 'All') return cheques.length;
    return cheques.filter((c) => c.status === status).length;
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
          <Link href="/dashboard/scan">
            <button className={styles.addBtn}>
              <div className={styles.addBtnIcon}>
                <Icon icon="ri:scan-2-line" className="text-sm" />
              </div>
              New Scan
            </button>
          </Link>

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
              <div className="absolute right-0 top-12 w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
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
      />

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
              />
            ))
          )}
        </div>
      </div>

      {/* Cheque Detail Modal */}
      {openedCheque && (
        <ClickedCheque cheque={openedCheque} onClose={() => setOpenedCheque(null)} />
      )}
    </div>
  );
}
