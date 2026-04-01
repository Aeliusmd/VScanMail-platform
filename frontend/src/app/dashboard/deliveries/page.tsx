"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { deliveries, type DeliveryRequest } from '../../../mocks/deliveries';
import DeliveryToolbar from './components/DeliveryToolbar';
import DeliveryRow from './components/DeliveryRow';
import ClickedDelivery from './components/ClickedDelivery';
import styles from './page.module.css';
import mailStyles from '../mails/page.module.css';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type TabType = 'All' | 'Pending' | 'In Transit' | 'Delivered' | 'Failed';

const TABS: TabType[] = ['All', 'Pending', 'In Transit', 'Delivered', 'Failed'];
const PER_PAGE = 10;

export default function DeliveriesPage() {
  return (
    <Suspense fallback={null}>
      <DeliveriesPageContent />
    </Suspense>
  );
}

function DeliveriesPageContent() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [requests, setRequests] = useState<DeliveryRequest[]>(deliveries);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openedRequest, setOpenedRequest] = useState<DeliveryRequest | null>(null);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});

  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const router = useRouter();
  const pathname = usePathname();
  const isSuperadminRoute = pathname.startsWith('/superadmin');
  const scanPath = isSuperadminRoute ? '/superadmin/scan' : '/dashboard/scan';

  useEffect(() => {
    if (!tabFromUrl) return;
    const nextTab = (TABS as string[]).includes(tabFromUrl) ? (tabFromUrl as TabType) : null;
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setPage(1);
    }
  }, [tabFromUrl, activeTab]);

  const notifications = useMemo(
    () => [
      { id: 1, text: 'New delivery request created for Tech Solutions Inc', time: '5 mins ago', unread: true },
      { id: 2, text: 'Tracking updated for Global Enterprises delivery', time: '12 mins ago', unread: true },
      { id: 3, text: 'Delivery completed for Innovate Corp', time: '25 mins ago', unread: false },
      { id: 4, text: 'Delivery attempt failed for Prime Industries', time: '1 hour ago', unread: false },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchTab = activeTab === 'All' || r.status === activeTab;
      const matchSearch =
        q === '' ||
        r.company.toLowerCase().includes(q) ||
        r.mailSubject.toLowerCase().includes(q) ||
        r.deliveryAddress.toLowerCase().includes(q) ||
        r.trackingNumber.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [requests, activeTab, search]);

  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  }, [filtered, page]);

  const allChecked = useMemo(() => {
    if (filtered.length === 0) return false;
    return filtered.every((r) => selectedIds.has(r.id));
  }, [filtered, selectedIds]);

  const selectedCount = selectedIds.size;

  const tabCount = useMemo(() => {
    const counts: Record<TabType, number> = {
      All: requests.length,
      Pending: 0,
      'In Transit': 0,
      Delivered: 0,
      Failed: 0,
    };
    for (const r of requests) counts[r.status] += 1;
    return counts;
  }, [requests]);

  const onToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onToggleAll = () => {
    if (allChecked) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((r) => r.id)));
  };

  const onMarkReadSelected = () => {
    if (selectedIds.size === 0) return;
    const ids = new Set(selectedIds);
    setRequests((prev) => prev.map((r) => (ids.has(r.id) ? { ...r, read: true } : r)));
    setOpenedRequest((prev) => (prev && ids.has(prev.id) ? { ...prev, read: true } : prev));
    setSelectedIds(new Set());
  };

  const onToggleStar = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, starred: !r.starred } : r)));
  };

  const openRequest = (request: DeliveryRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, read: true } : r)));
    setOpenedRequest({ ...request, read: true });
  };

  const handleMarkDelivered = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Delivered' } : r)));
    setActionFeedback((prev) => ({ ...prev, [id]: 'delivered' }));
    window.setTimeout(() => setActionFeedback((prev) => ({ ...prev, [id]: '' })), 2500);
    setOpenedRequest((prev) => (prev?.id === id ? { ...prev, status: 'Delivered' } : prev));
  };

  const handleResend = (id: string) => {
    setActionFeedback((prev) => ({ ...prev, [id]: 'resent' }));
    window.setTimeout(() => setActionFeedback((prev) => ({ ...prev, [id]: '' })), 2500);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={mailStyles.topBar}>
        <div className={mailStyles.searchContainer}>
          
          <div className={mailStyles.searchIcon}>
            <Icon icon="ri:search-line" className="text-sm" />
          </div>
         
          <input
            type="text"
            placeholder="Search delivery requests..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={mailStyles.searchInput}
          />
        </div>

        <div className={mailStyles.topActions}>
        <Link href={scanPath}>
          <button className={mailStyles.newScanBtn} onClick={() => {}}>
            <div className={mailStyles.newScanIcon}>
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
              <div className={mailStyles.notifIconWrap}>
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
              <div className="w-4 h-4 flex items-center justify-center text-gray-400 hidden sm:flex">
                <Icon icon="ri:arrow-down-s-line" className="text-base" />
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
                  <div className="w-4 h-4 flex items-center justify-center">
                    <Icon icon="ri:logout-box-r-line" className="text-sm" />
                  </div>
                  Sign Out
                </a>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      <DeliveryToolbar
        total={filtered.length}
        selectedCount={selectedCount}
        allChecked={allChecked}
        page={page}
        perPage={PER_PAGE}
        onToggleAll={onToggleAll}
        onMarkReadSelected={onMarkReadSelected}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => (page * PER_PAGE < filtered.length ? p + 1 : p))}
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
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
          >
            {tab}
            {tab !== 'All' && <span className={styles.tabCount}>{tabCount[tab]}</span>}
          </button>
        ))}
      </div>

      <div className={styles.tableContainer}>
        {paginated.length > 0 ? (
          paginated.map((request) => (
            <DeliveryRow
              key={request.id}
              request={request}
              selected={selectedIds.has(request.id)}
              onSelect={onToggleSelect}
              onToggleStar={onToggleStar}
              onOpen={() => openRequest(request)}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <Icon icon="ri:inbox-line" className="text-4xl text-gray-300 mb-2" />
            <p>No delivery requests found</p>
          </div>
        )}
      </div>

      {openedRequest && (
        <ClickedDelivery
          request={openedRequest}
          actionFeedback={actionFeedback}
          onClose={() => setOpenedRequest(null)}
          onMarkDelivered={handleMarkDelivered}
          onResend={handleResend}
        />
      )}
    </div>
  );
}

