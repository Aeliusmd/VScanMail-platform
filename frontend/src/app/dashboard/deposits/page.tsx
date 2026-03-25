"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { deposits, type Deposit } from '../../../mocks/deposits';
import DepositToolbar from './components/DepositToolbar';
import DepositRow from './components/DepositRow';
import ClickedDeposit from './components/ClickedDeposit';
import depositStyles from './page.module.css';
import mailStyles from '../mails/page.module.css';

type TabType = 'All' | 'Pending' | 'Approved' | 'Rejected' ;

const TABS: { label: TabType }[] = [
  { label: 'All' },
  { label: 'Pending' },
  { label: 'Approved' },
  { label: 'Rejected' },

];

const PER_PAGE = 10;

export default function DepositsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openedDeposit, setOpenedDeposit] = useState<Deposit | null>(null);

  const notifications = [
    { id: 1, text: 'Deposit approved for Tech Solutions Inc', time: '5 mins ago', unread: true },
    { id: 2, text: 'Pending deposit review for Summit LLC', time: '12 mins ago', unread: true },
    { id: 3, text: 'Rejected deposit requires action', time: '25 mins ago', unread: false },
  ];

  const filtered = deposits.filter((d) => {
    const matchTab = activeTab === 'All' || d.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      search === '' ||
      d.company.toLowerCase().includes(q) ||
      d.bankName.toLowerCase().includes(q) ||
      d.bankCode.toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  const totalAmount = filtered.reduce((sum, d) => sum + d.amount, 0);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const getTabCount = (status: TabType) => {
    if (status === 'All') return deposits.length;
    return deposits.filter((d) => d.status === status).length;
  };

  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className={depositStyles.pageContainer}>
      {/* Mail-style Header (same layout as Dashboard Mails) */}
      <div className={mailStyles.topBar}>
        <div className={mailStyles.searchContainer}>
          <div className={mailStyles.searchIcon}>
            <Icon icon="ri:search-line" className="text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search deposit requests..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={mailStyles.searchInput}
          />
        </div>

        <div className={mailStyles.topActions}>
          <button className={mailStyles.newScanBtn}>
            <div className={mailStyles.newScanIcon}>
              <Icon icon="ri:scan-2-line" className="text-sm" />
            </div>
            New Scan
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer relative"
            >
              <div className={mailStyles.notifIconWrap}>
                <Icon icon="ri:notification-3-line" className="text-[20px] leading-none" />
              </div>
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
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex gap-3 ${
                        n.unread ? 'bg-[#EFF6FF]/40' : ''
                      }`}
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EFF6FF] flex-shrink-0">
                        <Icon icon="ri:mail-line" className="text-[#1E40AF] text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-5">{n.text}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                      {n.unread && (
                        <span className="w-2 h-2 bg-[#1E40AF] rounded-full flex-shrink-0 mt-1.5"></span>
                      )}
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
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                AD
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-4">Admin User</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <div className="w-4 h-4 items-center justify-center text-gray-400 hidden sm:flex">
                <Icon icon="ri:arrow-down-s-line" className="text-base" />
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
                <a href="#" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:user-line" className="text-sm" /></div>
                  My Profile
                </a>
                <a href="#" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:settings-3-line" className="text-sm" /></div>
                  Settings
                </a>
                <div className="border-t border-gray-100 my-1"></div>
                <a href="/login" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer">
                  <div className="w-4 h-4 flex items-center justify-center"><Icon icon="ri:logout-box-r-line" className="text-sm" /></div>
                  Sign Out
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar (above tabs) */}
      <DepositToolbar
        total={filtered.length}
        totalAmount={totalAmount}
        page={page}
        perPage={PER_PAGE}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => (page * PER_PAGE < filtered.length ? p + 1 : p))}
      />

      {/* Tabs */}
      <div className={depositStyles.tabsContainer}>
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              setActiveTab(tab.label);
              setPage(1);
            }}
            className={`${depositStyles.tab} ${activeTab === tab.label ? depositStyles.active : ''}`}
          >
            {tab.label} <span className={depositStyles.tabCount}>{getTabCount(tab.label)}</span>
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className={depositStyles.tableContainer}>
        {paginated.length > 0 ? (
          paginated.map((deposit) => (
            <DepositRow
              key={deposit.id}
              deposit={deposit}
              selected={selectedIds.includes(deposit.id)}
              onSelect={handleSelect}
              onOpen={() => setOpenedDeposit(deposit)}
            />
          ))
        ) : (
          <div className={depositStyles.emptyState}>
            <Icon icon="ri:inbox-line" className="text-4xl text-gray-300 mb-2" />
            <p>No deposits found</p>
          </div>
        )}
      </div>

      {/* Clicked Deposit Popup */}
      {openedDeposit && (
        <ClickedDeposit
          deposit={openedDeposit}
          onClose={() => setOpenedDeposit(null)}
        />
      )}
    </div>
  );
}
